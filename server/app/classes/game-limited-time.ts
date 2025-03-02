import { Game } from '@app/classes/game';
import { MAX_TIME, SECONDS_TO_MILLISECONDS } from '@app/constants/constants';
import { GameInfo } from '@app/interfaces/game-info';
import { Player } from '@app/interfaces/player';
import { GameInstance, GameType } from 'common/game-instance';
import { Pixel } from 'common/pixel';
import { GameSettings } from 'common/settings';
import * as fs from 'fs';

export class GameLimitedTime extends Game {
    private gameTitles: string[];
    private timerIncrement: number;

    constructor(gameTitles: string[], players: Player[], settings: GameSettings) {
        super(GameType.LimitedTime, players, settings.penaltyTime);
        this.timerIncrement = settings.bonusTime;
        this.time = settings.initialTime;
        this.archive.gameTitle = '';
        this.gameTitles = gameTitles;
    }

    async start(): Promise<false | GameInstance> {
        const gameInfo = await this.getNextGameInfo();
        if (!gameInfo) {
            this.stopTimer();
            return false;
        }
        this.differences = gameInfo.differences;

        this.gameManager.emitTo('gameTimeUpdated', this.time * SECONDS_TO_MILLISECONDS, this.room);
        return {
            title: gameInfo.title,
            isHard: gameInfo.isHard,
            gameMode: GameType.LimitedTime,
            nbDiff: this.differences.length,
            players: Object.values(this.players),
            hintPenalty: this.hintPenalty,
        };
    }

    async checkClick(pixel: Pixel, socketId: string): Promise<void> {
        if (!this.isPlayerInGame(socketId)) return;
        const diffCoord = this.findDifference(pixel, socketId);

        if (!diffCoord) return; // If no difference is found, game hasn't ended

        let gameInfo;
        const files: ArrayBuffer[] = [];
        do {
            gameInfo = await this.getNextGameInfo();
            if (!gameInfo) {
                this.gameManager.emitTo('differenceFound', undefined, this.room);
                this.gameManager.emitTo('gameFinished', { prompt: 'Vous avez gagné!', details: 'Vous avez résolu toutes les fiches.' }, this.room);
                this.removeGame();
                return;
            }

            for (const image of [gameInfo.title + '/1.bmp', gameInfo.title + '/2.bmp']) {
                const file = await new Promise<ArrayBuffer>((resolve) => {
                    fs.readFile(process.cwd() + '/assets/games/data/' + image, (_, data) => resolve(data));
                });
                files.push(file);
            }
        } while (!files && !files[0] && !files[1]);

        this.differences = gameInfo.differences;
        this.time = Math.min(this.time + this.timerIncrement, MAX_TIME);
        this.gameManager.emitTo('gameTimeUpdated', this.time * SECONDS_TO_MILLISECONDS, this.room);
        this.gameManager.emitTo(
            'differenceFound',
            {
                image1: files[0],
                image2: files[1],
                gameData: {
                    title: gameInfo.title,
                    isHard: gameInfo.isHard,
                    gameMode: GameType.LimitedTime,

                    nbDiff: this.differences.length,
                    players: Object.values(this.players),
                },
            },
            this.room,
        );
    }

    abandon(socketId: string): void {
        if (!this.isPlayerInGame(socketId)) return;
        this.archive.hasAbandoned = true;
        this.archive.isPlayer1 = this.players[socketId] === this.archive.p1Name;
        this.gameManager.emitTo('serverMessage', this.players[socketId] + ' a abandonné la partie', this.room);
        delete this.players[socketId];
        if (Object.keys(this.players).length === 1) this.gameManager.emitTo('playerLeft', Object.values(this.players), this.room);
        else this.removeGame();
    }

    protected updateTime(n: number): void {
        this.time = Math.max(0, this.time - n);
        this.gameManager.emitTo('gameTimeUpdated', this.time * SECONDS_TO_MILLISECONDS, this.room);
        if (this.time === 0) {
            this.gameManager.emitTo('gameFinished', { prompt: 'Vous avez perdu!', details: 'Le temps est écoulé.' }, this.room);
            this.removeGame();
        }
    }

    private async getNextGameInfo(): Promise<GameInfo | undefined> {
        let gameInfo;
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.gameTitles.length); // generate a random index
        } while (this.gameTitles.length > 0 && !(gameInfo = await (await this.dataService).getGame(this.gameTitles.splice(randomIndex, 1)[0])));
        return gameInfo;
    }
}
