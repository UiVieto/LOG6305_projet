/* eslint-disable max-lines */
// Max-line is disabled because this file is a test file and it is not a problem to have a long file for testing purposes
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { EndgamePopUpComponent } from '@app/components/endgame-pop-up/endgame-pop-up.component';
import { JoinRequestPopupComponent } from '@app/components/join-request-popup/join-request-popup.component';
import { MessageComponent } from '@app/components/message/message.component';
import { WaitingRoomPopupComponent } from '@app/components/waiting-room-popup-component/waiting-room-popup-component.component';
import { ChatColor, Time } from '@app/constants/constants';
import { GameFeedbackService } from '@app/services/game-feedback.service';
import { GameType } from '@common/game-instance';
import { Message } from '@common/message';
import { Pixel } from '@common/pixel';
import { PlayingUser } from '@common/playing-user';
import { GameSettings } from '@common/settings';
import { Observable, of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { CommunicationService } from './communication.service';
import { GameSocketService } from './game-socket.service';
import { SaveReplayService } from './save-replay.service';
import { SheetContainerService } from './sheet-container.service';
import { SocketClientService } from './socket-client.service';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}
describe('GameSocketService', () => {
    const TIME = 10;

    let service: GameSocketService;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let gameFeedbackService: GameFeedbackService;
    let sheetContainerService: SheetContainerService;
    let comsService: CommunicationService;
    let saveReplayService: SaveReplayService;
    let routerSpy: Router;
    let matDialogMock: { open: unknown };
    let mockWindowObj: { location: { href: string; search: string; pathname: string; replace: unknown; reload: jasmine.Spy } };
    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        matDialogMock = {
            open: () => {
                return {
                    afterClosed: () => of(true),
                };
            },
        };

        mockWindowObj = {
            location: {
                href: '',
                search: '?hello=world',
                pathname: '/some/path',
                replace: () => {
                    return;
                },
                reload: jasmine.createSpy(),
            },
        };

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, MatDialogModule, BrowserAnimationsModule],
            providers: [
                GameSocketService,
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialog, useValue: matDialogMock },
                { provide: Router, useValue: routerSpy },
                { provide: Window, useValue: mockWindowObj },
            ],
        });
        service = TestBed.inject(GameSocketService);
        gameFeedbackService = TestBed.inject(GameFeedbackService);
        sheetContainerService = TestBed.inject(SheetContainerService);
        comsService = TestBed.inject(CommunicationService);
        saveReplayService = TestBed.inject(SaveReplayService);
        service.gameInstance = {
            title: 'test',
            isHard: false,
            nbDiff: 1,
            players: ['player1', 'player2'],
            gameMode: GameType.Classic,
            hintPenalty: 30,
        };
        sheetContainerService.currentGames = [
            {
                title: 'test',
                bestTimes: {
                    solo: [
                        { playerName: 'user1', time: 100 },
                        { playerName: 'user1', time: 100 },
                        { playerName: 'user1', time: 100 },
                    ],
                    versus: [
                        { playerName: 'user2', time: 100 },
                        { playerName: 'user2', time: 100 },
                        { playerName: 'user2', time: 100 },
                    ],
                },
                isHard: true,
                isInitiallyVsActive: true,
                image1: new Observable<string>(),
            },
        ];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Receiving events', () => {
        it('should handle disconnect event', () => {
            socketHelper.peerSideEmit('disconnect');
            expect(gameFeedbackService.isCheating).toEqual(false);
        });

        it('should call next on usernameValidity', () => {
            service.isValidUsername.next = jasmine.createSpy();
            socketHelper.peerSideEmit('usernameValidity', true);
            expect(service.isValidUsername.next).toHaveBeenCalledWith(true);
        });

        it('should update time on gameTimeUpdated', () => {
            service.serverTimer.next = jasmine.createSpy();
            socketHelper.peerSideEmit('gameTimeUpdated', TIME);
            expect(service.serverTimer.next).toHaveBeenCalledWith(TIME);
        });

        it('should update prompt on refused', () => {
            const waitingRoomRef = jasmine.createSpyObj('waitingRoomRef', ['componentInstance']);
            waitingRoomRef.componentInstance = { data: { prompt: '' } };
            service.waitingRoomRef = waitingRoomRef;
            socketHelper.peerSideEmit('playerRefused');
            expect(waitingRoomRef.componentInstance.data.prompt).toBe("L'hôte a refusé la partie.");
        });

        it('should open dialog on kicked', fakeAsync(() => {
            service.reload = () => {
                return;
            };
            service['dialog'].open = jasmine.createSpy();
            const dialogRef = jasmine.createSpyObj('dialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of(true));
            const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
            dialogSpy.open.and.returnValue(dialogRef);
            service['dialog'] = dialogSpy;
            socketHelper.peerSideEmit('kicked');
            tick();
            expect(dialogSpy.open).toHaveBeenCalledWith(WaitingRoomPopupComponent, {
                width: '20%',
                data: { gameTitle: '', prompt: "La partie n'existe plus." },
                disableClose: true,
                panelClass: 'container',
                autoFocus: false,
            });
        }));

        it('should open dialog on playerRequestJoin', fakeAsync(() => {
            service['dialog'].open = jasmine.createSpy();
            const dialogRef = jasmine.createSpyObj('dialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of(true));
            const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
            dialogSpy.open.and.returnValue(dialogRef);
            service['dialog'] = dialogSpy;
            const user = { card: 'test', user: 'user' };
            socketHelper.peerSideEmit('playerRequestJoin', user);
            tick();
            expect(dialogSpy.open).toHaveBeenCalledWith(JoinRequestPopupComponent, {
                width: '30%',
                data: user,
                panelClass: 'container',
                autoFocus: false,
            });
        }));

        it('should send refuse to server if host refuses', fakeAsync(() => {
            const dialogRef = jasmine.createSpyObj('dialogRef', ['afterClosed']);
            const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
            dialogSpy.open.and.returnValue(dialogRef);
            service['dialog'] = dialogSpy;
            const user = { card: 'test', user: 'user' };
            dialogRef.afterClosed.and.returnValue(of(false));
            const mySpy = spyOn(service.socketService, 'send');
            socketHelper.peerSideEmit('playerRequestJoin', user);
            tick();
            expect(mySpy).toHaveBeenCalledWith('refusePlayer2');
        }));

        it('should send accept to server if host accepts', fakeAsync(() => {
            const dialogRef = jasmine.createSpyObj('dialogRef', ['afterClosed']);
            const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
            dialogSpy.open.and.returnValue(dialogRef);
            service['dialog'] = dialogSpy;
            const user = { card: 'test', user: 'user' };
            dialogRef.afterClosed.and.returnValue(of(true));
            const mySpy = spyOn(service.socketService, 'send');
            socketHelper.peerSideEmit('playerRequestJoin', user);
            tick();
            expect(mySpy).toHaveBeenCalledWith('acceptPlayer2');
        }));

        it('should createGame on gameCreated event', () => {
            const mockData = ['test1', 'test2'] as [string, string];
            spyOn(comsService, 'getGameFiles').and.returnValue(of(mockData));
            service['dialog'].closeAll = jasmine.createSpy();
            const gameInstance = { title: 'stub', isHard: false, nbDiff: 5, players: ['player1'] };
            socketHelper.peerSideEmit('gameCreated', gameInstance);
            expect(service.messages).toEqual([]);
            expect(service['dialog'].closeAll).toHaveBeenCalled();
            expect(service.image1).toEqual('test1');
            expect(service.image2).toEqual('test2');
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/game']);
        });

        it('should handle errorClick', fakeAsync(() => {
            const pos = { x: 0, y: 0 };
            spyOn(service, 'playFeedbackSound');
            spyOn(service.gameFeedbackService, 'drawError');
            spyOn(service.gameFeedbackService, 'clearError');

            socketHelper.peerSideEmit('errorClick', pos);
            expect(service.playFeedbackSound).toHaveBeenCalledWith(false);
            expect(service['frozenByError']).toBe(true);
            expect(service.gameFeedbackService.drawError).toHaveBeenCalledWith(pos);
            tick(Time.SecToMs);
            expect(service['frozenByError']).toBe(false);
            expect(service.gameFeedbackService.clearError).toHaveBeenCalled();
        }));

        it('should open endgame pop-up on gameFinished', fakeAsync(() => {
            service['dialog'].open = jasmine.createSpy();
            service['dialog'].closeAll = jasmine.createSpy();
            const dialogRef = jasmine.createSpyObj('dialogRef', ['afterClosed']);
            dialogRef.afterClosed.and.returnValue(of(true));
            const dialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
            dialogSpy.open.and.returnValue(dialogRef);
            service['dialog'] = dialogSpy;
            socketHelper.peerSideEmit('gameFinished', { user: 'Vous', abandoned: false });
            tick();
            expect(dialogSpy.open).toHaveBeenCalledWith(EndgamePopUpComponent, {
                data: { user: 'Vous', abandoned: false },
                width: '30%',
                panelClass: 'container',
                disableClose: true,
                autoFocus: false,
            });
        }));

        it('becameHost should prompt right string', () => {
            const waitingRoomRef = jasmine.createSpyObj('waitingRoomRef', ['componentInstance']);
            waitingRoomRef.componentInstance = { data: { prompt: '' }, panelClass: 'container' };
            service.waitingRoomRef = waitingRoomRef;
            socketHelper.peerSideEmit('becameHost');
            expect(waitingRoomRef.componentInstance.data.prompt).toBe("En attente d'un joueur...");
        });
        it('serverMessage should add message to messages', () => {
            socketHelper.peerSideEmit('serverMessage', 'test');
            const message = new MessageComponent();
            message.color = ChatColor.Server;
            message.date = jasmine.any(String) as unknown as string;
            message.message = { sender: 'SERVEUR', text: 'test' } as Message;

            expect(service.messages).toContain(message);
        });

        it('chatMessageToRoom should add chatMessage', () => {
            const messageInput = { sender: 'SERVEUR', text: 'test' } as Message;
            socketHelper.peerSideEmit('chatMessageToRoom', messageInput);
            const message = new MessageComponent();
            message.message = messageInput;
            message.color = ChatColor.Received;
            message.date = jasmine.any(String) as unknown as string;
            expect(service.messages).toContain(message);
        });

        it('should init settings ', () => {
            const settings = { initialTime: 40, penaltyTime: 10, bonusTime: 10 };
            socketHelper.peerSideEmit('initSettings', settings);
            expect(service.settingsValue.value).toEqual(settings);
        });

        it('should update settings ', () => {
            const settings = { initialTime: 40, penaltyTime: 10, bonusTime: 10 } as GameSettings;
            socketHelper.peerSideEmit('settingsChanged', settings);
            expect(service.settingsValue.value).toEqual(settings);
        });

        it('should update bestTime ', () => {
            const bestGame = {
                title: 'test',
                bestTimes: {
                    solo: [
                        { playerName: 'user1', time: 10 },
                        { playerName: 'user1', time: 10 },
                        { playerName: 'user1', time: 10 },
                    ],
                    versus: [
                        { playerName: 'user2', time: 10 },
                        { playerName: 'user2', time: 10 },
                        { playerName: 'user2', time: 10 },
                    ],
                },
                isHard: true,
                isInitiallyVsActive: true,
                image1: new Observable<string>(),
            };
            socketHelper.peerSideEmit('updateBestTime', bestGame);
            expect(sheetContainerService.currentGames[0]).toEqual(bestGame);
        });

        it('newBestTimeMessage should add chatMessage', () => {
            const messageText = 'test';
            socketHelper.peerSideEmit('newBestTimeMessage', messageText);
            const message = new MessageComponent();
            message.color = ChatColor.BestTime;
            message.date = new Date().toLocaleTimeString('it-IT');
            message.message = { sender: 'SERVEUR', text: messageText } as Message;
            message.date = jasmine.any(String) as unknown as string;
            expect(service.messages).toContain(message);
        });

        it('should update best times', () => {
            const bestTimes = {
                solo: [
                    { playerName: 'user1', time: 10 },
                    { playerName: 'user1', time: 10 },
                    { playerName: 'user1', time: 10 },
                ],
                versus: [
                    { playerName: 'user2', time: 10 },
                    { playerName: 'user2', time: 10 },
                    { playerName: 'user2', time: 10 },
                ],
            };
            socketHelper.peerSideEmit('updateAllBestTimes', bestTimes);
            for (const i of sheetContainerService.currentGames) expect(i.bestTimes).toEqual(bestTimes);
        });

        it('gameHistoryAdded should call gethistory of sheetContainerService', async () => {
            sheetContainerService.getHistory = jasmine.createSpy('gethistory');
            socketHelper.peerSideEmit('gameHistoryAdded');
            expect(sheetContainerService.getHistory).toHaveBeenCalled();
        });

        it('delete History should set sheetContainer.currentHistory to []', async () => {
            socketHelper.peerSideEmit('deleteHistory');
            expect(sheetContainerService.currentHistory).toEqual([]);
        });

        it('cluePixelPos should call useClue', () => {
            gameFeedbackService.useClue = jasmine.createSpy('useClue');
            socketHelper.peerSideEmit('cluePixelPos');
            expect(gameFeedbackService.useClue).toHaveBeenCalled();
        });
    });

    describe('Emiting events', () => {
        it('should send useClue', () => {
            const spy = spyOn(service.socketService, 'send');
            const eventName = 'useClue';
            service.requestClue();
            expect(spy).toHaveBeenCalledWith(eventName);
        });

        it('should send a click to server', () => {
            service.gameInstance = { title: 'stub', isHard: false, nbDiff: 5, players: ['player1'], gameMode: GameType.Classic, hintPenalty: 30 };
            service['frozenByError'] = false;
            const spy = spyOn(service.socketService, 'send');
            const eventName = 'sendClick';
            const testPixel = { x: 50, y: 50 } as Pixel;
            const currentCtx = document.createElement('canvas').getContext('2d');
            if (currentCtx) service.sendClick(testPixel, currentCtx);
            expect(spy).toHaveBeenCalledWith(eventName, testPixel);
        });

        it('should send startGameSolo to server when gameMode is solo', () => {
            const spy = spyOn(service.socketService, 'send');
            const player = { gameTitle: 'test', username: 'user' } as PlayingUser;
            service.createGameSolo(player);
            expect(spy).toHaveBeenCalledWith('startGameSolo', player);
            expect(service.username).toEqual(player.username);
        });

        it('should send createGameVs on startGame', fakeAsync(() => {
            const player: PlayingUser = {
                username: 'test',
                gameTitle: 'test game',
            };
            spyOn(service.socketService, 'send');
            const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
            dialogRef.afterClosed.and.returnValue(of(true));
            const dialog = jasmine.createSpyObj('MatDialog', ['open']);
            dialog.open.and.returnValue(dialogRef);
            service.createGameVs(player, true);
            expect(service.socketService.send).toHaveBeenCalledWith('startGameVs', player);
            service.createGameVs(player, false);
            expect(service.socketService.send).toHaveBeenCalledWith('startGameVs', player);
        }));

        it('createGameLimitedTime should send startGameLimitedTime', () => {
            const spy = spyOn(service.socketService, 'send');
            service.createGameLimitedTime('user', 'jouer');
            expect(spy).toHaveBeenCalled();
        });

        it('abandonGame should send abandonGame', () => {
            const spy = spyOn(service.socketService, 'send');
            service.abandonGame();
            expect(spy).toHaveBeenCalled();
        });

        it('should send joinselectionroom', () => {
            const spy = spyOn(service.socketService, 'send');
            service.joinSelectionRoom();
            expect(spy).toHaveBeenCalled();
        });

        it('validateUsername should send a validateUsername event ', () => {
            const spy = spyOn(service.socketService, 'send');
            const eventName = 'validateUsername';
            const username = 'user';
            service.validateUsername(username);
            expect(spy).toHaveBeenCalledWith(eventName, username);
        });

        it('sendChatMessage should send a chatMessage event ', () => {
            service.username = 'user';
            const message = new MessageComponent();
            message.color = ChatColor.Sent;
            message.message = { sender: service.username, text: 'test' } as Message;
            message.date = jasmine.any(String) as unknown as string;
            const spy = spyOn(service.socketService, 'send');
            service.handleChatMessageSent('test');
            expect(spy).toHaveBeenCalledWith('chatMessage', 'test');
            expect(service.messages).toContain(message);
        });

        it('updateSettings should send a updateSettings event ', () => {
            const settings = { initialTime: 30, penaltyTime: 5, bonusTime: 5 };
            const spy = spyOn(service.socketService, 'send');
            service.updateSettings(settings.initialTime, settings.penaltyTime, settings.bonusTime);
            expect(spy).toHaveBeenCalledWith('updateSettings', settings);
        });

        it('resetTime should send an event ', () => {
            const eventName = 'resetGameBestTimes';
            const otherEventName = 'resetAllBestTimes';
            const spy = spyOn(service.socketService, 'send');
            service.resetTime('test');
            expect(spy).toHaveBeenCalledWith(eventName, 'test');
            service.resetTime();
            expect(spy).toHaveBeenCalledWith(otherEventName);
        });
    });

    describe('non-socket functions', () => {
        it('playFeedbackSound should play right noise', () => {
            service['audio'].play = jasmine.createSpy('playAudio');
            service.playFeedbackSound(false);
            expect(service['audio'].src).toContain('/assets/wrong-answer.mp3');
            expect(service['audio'].play).toHaveBeenCalled();
        });

        it('playFeedbackSound should play right noise', () => {
            service['audio'].play = jasmine.createSpy('playAudio');
            service.playFeedbackSound(true);
            expect(service['audio'].src).toContain('/assets/right-answer.mp3');
            expect(service['audio'].play).toHaveBeenCalled();
        });

        it('setErrorDelay should set errorDelay', () => {
            const delay = 100;
            service.setErrorDelay(delay);
            expect(service['errorDelay']).toEqual(Time.SecToMs / delay);
        });

        it('should call saveAction on handleCheating', () => {
            saveReplayService.saveAction = jasmine.createSpy('saveAction');
            service.handleCheating();
            expect(saveReplayService.saveAction).toHaveBeenCalledWith(service['currentTime'], 'cheating', gameFeedbackService.isCheating);
        });

        it('should call saveAction on handleDifferenceFound', () => {
            const params = { playerName: 'test', difference: [] };
            saveReplayService.saveAction = jasmine.createSpy('saveAction');
            service.handleDifferenceFound(params.playerName, params.difference);
            expect(saveReplayService.saveAction).toHaveBeenCalledWith(service['currentTime'], 'difference', params);
        });

        it('should call clearDifferences on startReplay', () => {
            gameFeedbackService.clearDifferences = jasmine.createSpy('clearDifferences');
            service.startReplay();
            expect(gameFeedbackService.clearDifferences).toHaveBeenCalled();
        });
    });
});
