/* eslint-disable max-lines */
// All methods and properties in this file are implicitly related to communication over socket with the server.
// For readability purposes, we allow this max-line disable to centralize this logically connected information.
// Furthermore, comments and method descriptions add length to the file. but they improve readability.
import { Injectable, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EndgamePopUpComponent } from '@app/components/endgame-pop-up/endgame-pop-up.component';
import { JoinRequestPopupComponent } from '@app/components/join-request-popup/join-request-popup.component';
import { MessageComponent } from '@app/components/message/message.component';
import { WaitingRoomPopupComponent } from '@app/components/waiting-room-popup-component/waiting-room-popup-component.component';
import { ChatColor, PlaybackConstants, Time } from '@app/constants/constants';
import { Game } from '@common/game';
import { GameInstance } from '@common/game-instance';
import { Message } from '@common/message';
import { Pixel } from '@common/pixel';
import { PlayingUser } from '@common/playing-user';
import { GameSettings } from '@common/settings';
import { BehaviorSubject, Subject } from 'rxjs';
import { CommunicationService } from './communication.service';
import { GameFeedbackService } from './game-feedback.service';
import { SaveReplayService } from './save-replay.service';
import { SheetContainerService } from './sheet-container.service';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class GameSocketService implements OnDestroy {
    isOngoing: boolean;
    gameInstance: GameInstance;
    image1: string;
    image2: string;
    username: string;
    isValidUsername: Subject<boolean>;
    serverTimer: BehaviorSubject<number>;
    waitingRoomRef: MatDialogRef<WaitingRoomPopupComponent>;
    messages: MessageComponent[];
    settingsValue: BehaviorSubject<GameSettings>;
    private audio: HTMLAudioElement;
    private frozenByError: boolean;
    private currentTime: number;
    private errorDelay: number;

    // The max-params rule is disabled because the class needs all of these services to work properly.
    // eslint-disable-next-line max-params
    constructor(
        private router: Router, // Needed to redirect user to various pages on server messages
        public socketService: SocketClientService, // Allows socket communication
        private communicationService: CommunicationService, // Allows http requests for files and basic game information download
        private dialog: MatDialog, // Needed to prompt the user for multiplayer games which is dictated by server messages
        private sheetContainerService: SheetContainerService, // Needed to update sheets best time display
        public gameFeedbackService: GameFeedbackService, // Needed to call game logic on server message
        private saveReplay: SaveReplayService, // Needed to save any server message to replicate game on replay
    ) {
        this.isOngoing = false;
        this.isValidUsername = new Subject<boolean>();
        this.messages = [];
        this.audio = new Audio();
        this.frozenByError = false;
        this.settingsValue = new BehaviorSubject({ initialTime: 30, penaltyTime: 5, bonusTime: 5 });
        this.serverTimer = new BehaviorSubject<number>(0);
        this.errorDelay = Time.SecToMs;
        this.connect();

        this.serverTimer.subscribe((currentTime) => {
            this.currentTime = currentTime;
        });
    }

    ngOnDestroy(): void {
        this.socketService.disconnect();
    }

    connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
            this.configureBaseSocketFeatures();
        }
    }

    setErrorDelay(delay: number) {
        this.errorDelay = Time.SecToMs / delay;
    }

    configureBaseSocketFeatures() {
        this.socketService.on('disconnect', () => {
            this.gameFeedbackService.isCheating = false;
        });
        this.socketService.on('initSettings', (settings: GameSettings) => {
            this.settingsValue.next(settings);
        });
        /*
         * The client receives the game instance from the server and navigates to the game page
         */
        this.socketService.on('gameCreated', (game: GameInstance) => {
            this.isOngoing = true;
            this.messages = [];
            this.dialog.closeAll();
            this.gameInstance = game;
            this.gameFeedbackService.nbClues = 3;
            this.errorDelay = Time.SecToMs;
            this.communicationService.getGameFiles(game.title).subscribe((data) => {
                this.image1 = data[0];
                this.image2 = data[1];
                this.router.navigate(['/game']);
            });
        });

        /*
         * Sets the username validity to true or false depending on the server response
         * (the server verifies if the username is already taken)
         */
        this.socketService.on('usernameValidity', (isValid: boolean) => {
            this.isValidUsername.next(isValid);
        });

        /*
         * Sets the time of the client to the time of the server
         * (the server sends the time every second)
         */
        this.socketService.on('gameTimeUpdated', this.handleGameTimeUpdated);

        /*
         * The client is refused by the host
         */
        this.socketService.on('playerRefused', () => {
            this.waitingRoomRef.componentInstance.data.prompt = "L'hôte a refusé la partie.";
        });

        this.socketService.on('kicked', () => {
            this.dialog
                .open(WaitingRoomPopupComponent, {
                    width: '20%',
                    data: { gameTitle: '', prompt: "La partie n'existe plus." },
                    disableClose: true,
                    panelClass: 'container',
                    autoFocus: false,
                })
                .afterClosed()
                .subscribe(() => {
                    this.reload();
                });
        });

        /*
         * The host receives the request to join the game and opens a popup to accept or refuse the request
         */
        this.socketService.on('playerRequestJoin', (user: PlayingUser) => {
            this.dialog
                .open(JoinRequestPopupComponent, { width: '30%', data: user, panelClass: 'container', autoFocus: false })
                .afterClosed()
                .subscribe((accepted: boolean) => {
                    this.socketService.send(accepted ? 'acceptPlayer2' : 'refusePlayer2');
                });
        });

        /*
         * The client receives an error from the server if he clicked on the wrong pixel
         * and draws the error on the canvas for a second
         */
        this.socketService.on('errorClick', this.handleErrorClick);

        /*
         * The client receives receives that the game is finished and opens a popup to display the winner
         */
        this.socketService.on('gameFinished', (data: { prompt: string; details: string }) => {
            this.gameFeedbackService.isCheating = false;
            this.isOngoing = false;
            this.dialog.closeAll();
            this.dialog.open(EndgamePopUpComponent, {
                data,
                width: '30%',
                panelClass: 'container',
                disableClose: true,
                autoFocus: false,
            });
        });

        /*
         * The client receives that the host has left the game and the next client in line becomes the host
         */
        this.socketService.on('becameHost', () => {
            this.waitingRoomRef.componentInstance.data.prompt = "En attente d'un joueur...";
        });

        this.socketService.on('serverMessage', this.handleServerMessage);

        this.socketService.on('chatMessageToRoom', this.handleChatMessageReceived);

        this.socketService.on('newBestTimeMessage', this.handleNewBestTimeMessage);

        this.socketService.on('settingsChanged', (settings: GameSettings) => {
            this.settingsValue.next(settings);
        });

        this.socketService.on('updateBestTime', (gameBestTime: Partial<Game>) => {
            const game = this.sheetContainerService.currentGames.find((g) => g.title === gameBestTime.title);
            if (game && gameBestTime.bestTimes) game.bestTimes = gameBestTime.bestTimes;
        });

        this.socketService.on('updateAllBestTimes', (bestTimes: Game['bestTimes']) => {
            this.sheetContainerService.currentGames.forEach((game) => {
                game.bestTimes = bestTimes;
            });
        });

        this.socketService.on('gameHistoryAdded', async () => {
            await this.sheetContainerService.getHistory();
        });

        this.socketService.on('deleteHistory', () => {
            this.sheetContainerService.currentHistory = [];
        });

        this.socketService.on('cluePixelPos', (pixels: Pixel[]) => {
            this.gameFeedbackService.useClue(pixels);
            this.saveReplay.saveAction(this.currentTime, 'clue', pixels);
            this.saveReplay.saveAction(
                Math.floor(this.currentTime + this.gameInstance.hintPenalty * Time.SecToMs),
                'time',
                Math.floor(this.currentTime + this.gameInstance.hintPenalty * Time.SecToMs),
            );
        });
    }

    requestClue() {
        this.socketService.send('useClue');
    }

    /**
     * The client sends the pixel he clicked to the server
     *
     * @param p the pixel the client clicked
     * @param currentCtx the canvas context of the current canvas
     */
    sendClick(p: Pixel, currentCtx: CanvasRenderingContext2D) {
        if (!this.frozenByError) {
            this.gameFeedbackService.currentErrorCtx = currentCtx;
            this.socketService.send('sendClick', p);
        }
    }

    /**
     * Requests the server to verify if the username is already taken
     *
     * @param username the username the client wants to use
     */
    validateUsername(username: string) {
        this.socketService.send('validateUsername', username);
    }

    /**
     * Requests the server to create a 1v1 game
     *
     * @param player Client's username and game title
     * @param isHost true if the client is the host, false otherwise
     */
    createGameVs(player: PlayingUser, isHost: boolean) {
        this.username = player.username;
        this.socketService.send('startGameVs', player);
        this.waitingRoomRef = this.dialog.open(WaitingRoomPopupComponent, {
            width: '20%',
            data: { gameTitle: player.gameTitle, prompt: isHost ? "En attente d'un joueur..." : "En attente de l'hôte..." },
            disableClose: true,
            panelClass: 'container',
            autoFocus: false,
        });
        this.waitingRoomRef.afterClosed().subscribe(() => {
            this.socketService.send('cancelWaitingRoom');
        });
    }

    /**
     * Requests the server to abandon the game when the client leaves the game page
     */
    abandonGame() {
        this.gameFeedbackService.isCheating = false;
        this.socketService.send('abandonGame');
    }

    /**
     * Requests the server to create a solo game
     *
     * @param player Client's username and game title
     */
    createGameSolo(player: PlayingUser) {
        this.username = player.username;
        this.socketService.send('startGameSolo', player);
    }

    createGameLimitedTime(username: string, buttonText: string) {
        this.username = username;
        this.socketService.send('startGameLimitedTime' + buttonText.replace(/^\w/, (c) => c.toUpperCase()), username);
    }

    /**
     * plays the right or wrong answer sound depending on the parameter
     *
     * @param isDifferenceFound true if the client clicked on the right pixel, false otherwise
     */
    playFeedbackSound(isDifferenceFound: boolean) {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.src = isDifferenceFound ? './assets/right-answer.mp3' : './assets/wrong-answer.mp3';
        this.audio.play();
    }

    /**
     * Requests the server to join the selection room
     */
    joinSelectionRoom() {
        this.socketService.send('joinSelectionRoom');
    }

    /**
     * Sends a message to the other player in the room and displays on this client's chat
     *
     * @param text the text the client wants to send
     */
    handleChatMessageSent(text: string, isReplay?: boolean, message?: MessageComponent) {
        if (!message) {
            message = new MessageComponent();
            message.color = ChatColor.Sent;
            message.message = { sender: this.username, text };
            message.date = new Date().toLocaleTimeString('it-IT');
        }
        this.messages.unshift(message);
        this.socketService.send('chatMessage', text);
        if (!isReplay) this.saveReplay.saveAction(this.currentTime, 'chatMessageSent', message);
    }

    /**
     * Handles the reception of a message from another player and displays it on this client's chat
     *
     * @param messageReceived the message the other player sent
     * @param isReplay true if the message is sent during a replay, false otherwise
     */
    handleChatMessageReceived = (messageReceived: Message, isReplay?: boolean, message?: MessageComponent) => {
        if (!message) {
            message = new MessageComponent();
            message.message = messageReceived;
            message.color = ChatColor.Received;
            message.date = new Date().toLocaleTimeString('it-IT');
        }
        this.messages.unshift(message);
        if (!isReplay) this.saveReplay.saveAction(this.currentTime, 'chatMessageReceived', message);
    };

    /**
     * Handles the reception of a message from the server and displays it on this client's chat
     *
     * @param text the text the server wants to send
     * @param isReplay true if the message is sent during a replay, false otherwise
     */
    handleServerMessage = (text: string, isReplay?: boolean, message?: MessageComponent) => {
        if (!message) {
            message = new MessageComponent();
            message.color = ChatColor.Server;
            message.message = { sender: 'SERVEUR', text };
            message.date = new Date().toLocaleTimeString('it-IT');
        }
        this.messages.unshift(message);
        if (!isReplay) this.saveReplay.saveAction(this.currentTime, 'serverMessage', message);
    };

    /**
     * Handles the reception of a message from the server when the client beats the best time and displays it on this client's chat
     *
     * @param text the text the server wants to send
     * @param isReplay true if the message is sent during a replay, false otherwise
     * @param message the message to display
     */
    handleNewBestTimeMessage = (text: string, isReplay?: boolean, message?: MessageComponent) => {
        if (!message) {
            message = new MessageComponent();
            message.color = ChatColor.BestTime;
            message.message = { sender: 'SERVEUR', text };
            message.date = new Date().toLocaleTimeString('it-IT');
        }
        this.messages.unshift(message);
        if (!isReplay) this.saveReplay.saveAction(this.currentTime, 'serverMessage', message);
    };

    /**
     * Handles a time update from the server (every 100ms). The replay saves the time update every second when the time % 1000 is 0.
     *
     * @param time the time the server sends
     * @param isReplay true if the time is sent during a replay, false otherwise
     */
    handleGameTimeUpdated = (time: number, isReplay?: boolean) => {
        this.serverTimer.next(time);
        if (this.currentTime % PlaybackConstants.MsInSec === 0 && !isReplay) {
            this.saveReplay.saveAction(this.currentTime, 'time', time);
        }
    };

    /**
     * Handles a user click on the canvases that doesn't correspond to a difference. The client is frozen for 1 second and the error is displayed.
     *
     * @param pos the pixel the client clicked
     * @param isReplay true if the click is sent during a replay, false otherwise
     */
    handleErrorClick = (pos: Pixel, isReplay?: boolean) => {
        this.playFeedbackSound(false);
        this.frozenByError = true;
        this.gameFeedbackService.drawError(pos);
        setTimeout(() => {
            this.frozenByError = false;
            this.gameFeedbackService.clearError();
        }, this.errorDelay);
        if (!isReplay) this.saveReplay.saveAction(this.currentTime, 'error', pos);
    };

    handleCheating() {
        this.saveReplay.saveAction(this.currentTime, 'cheating', this.gameFeedbackService.isCheating);
    }

    handleDifferenceFound(playerName: string, difference: Pixel[]) {
        this.saveReplay.saveAction(this.currentTime, 'difference', { playerName, difference });
    }

    startReplay() {
        this.messages.splice(0);
        this.gameFeedbackService.clearDifferences();
    }

    reload() {
        window.location.reload();
    }

    updateSettings(initialTime: number, penaltyTime: number, bonusTime: number) {
        this.socketService.send('updateSettings', { initialTime, penaltyTime, bonusTime } as GameSettings);
    }

    resetTime(gameTitle?: string) {
        if (gameTitle) this.socketService.send('resetGameBestTimes', gameTitle);
        else this.socketService.send('resetAllBestTimes');
    }
}
