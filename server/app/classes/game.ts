import { SECONDS_TO_MILLISECONDS, TENTH_OF_SECOND } from '@app/constants/constants';
import { Player } from '@app/interfaces/player';
import { DataService } from '@app/services/data.service';
import { GameManagerService } from '@app/services/game-manager.service';
import { GameArchive } from 'common/game-archive';
import { GameType } from 'common/game-instance';
import { Pixel } from 'common/pixel';
import * as io from 'socket.io';
export abstract class Game {
    // Relevant to socket.io
    protected sio: io.Server;
    protected roomProp: string;
    protected players: { [key: string]: string };
    protected archive: GameArchive;

    // Internal logic related
    protected differences: Pixel[][];
    protected time: number;
    protected hintPenalty: number;
    private timerId: ReturnType<typeof setInterval>;

    constructor(gameMode: GameType, players: Player[], hintPenalty: number) {
        this.roomProp = gameMode;
        this.players = {};
        players.forEach((player) => {
            this.roomProp += '-' + player.socket;
            this.players[player.socket] = player.name;
        });

        this.archive = {
            gameTitle: '',
            startDate: Date.now(),
            playingTime: 0,
            endClock: 0,
            gameMode,
            p1Name: players[0].name,
            p2Name: players[1] ? players[1].name : '',
            isPlayer1: true,
            hasAbandoned: false,
        };

        this.hintPenalty = hintPenalty;
        this.timerId = setInterval(() => {
            this.updateTime(TENTH_OF_SECOND);
        }, TENTH_OF_SECOND * SECONDS_TO_MILLISECONDS);
    }

    get isMultiplayer() {
        return Object.values(this.players).length >= 2;
    }

    get room(): string {
        return this.roomProp;
    }
    get history(): GameArchive {
        return this.archive;
    }
    protected get gameManager() {
        return GameManagerService.getInstance();
    }
    protected get dataService() {
        return DataService.getInstance();
    }

    isPlayerInGame(playerSid: string): boolean {
        return Object.keys(this.players).includes(playerSid);
    }

    sendMessage(senderId: string, message: string) {
        if (!this.isPlayerInGame(senderId)) return;
        const otherPlayerSocket = Object.keys(this.players).find((playerSocket) => playerSocket !== senderId);
        if (otherPlayerSocket) this.gameManager.emitTo('chatMessageToRoom', { sender: this.players[senderId], text: message }, otherPlayerSocket);
    }

    useClue(socketId: string) {
        this.gameManager.emitTo('cluePixelPos', this.differences[Math.floor(Math.random() * this.differences.length)], socketId);
        this.gameManager.emitTo('serverMessage', new Date().toLocaleTimeString('it-IT') + ' - Indice utilisé', this.room);
        this.updateTime(this.hintPenalty);
    }

    protected findDifference(pixel: Pixel, socketId: string): Pixel[] | undefined {
        // Finds the difference which contains user's input pixel, if any
        const foundDifference = this.differences.find((difference: Pixel[]) => difference.some((p: Pixel) => p.x === pixel.x && p.y === pixel.y));
        if (!foundDifference) this.gameManager.emitTo('errorClick', pixel, socketId);

        let message = foundDifference ? 'Différence trouvée' : 'Erreur'; // Generates server message accordingly
        if (this.isMultiplayer) message += ' par ' + this.players[socketId]; // Adds text for multiplayer games
        this.gameManager.emitTo('serverMessage', message, this.room);

        return foundDifference;
    }

    protected stopTimer() {
        clearInterval(this.timerId);
        this.archive.endClock = Math.floor(this.time);
    }

    protected removeGame() {
        this.stopTimer();
        this.archive.playingTime = Date.now() - this.archive.startDate;
        this.gameManager.removeGame(this);
    }

    abstract checkClick(pixel: Pixel, socketId: string): Promise<void>;
    abstract abandon(socketId: string): void;
    protected abstract updateTime(n: number): void;
}
