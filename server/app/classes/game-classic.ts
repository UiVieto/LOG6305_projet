import { Game } from '@app/classes/game';
import { NOT_TOP_THREE, SECONDS_TO_MILLISECONDS } from '@app/constants/constants';
import { GameInfo } from '@app/interfaces/game-info';
import { Player } from '@app/interfaces/player';
import { GameInstance, GameType } from 'common/game-instance';
import { Pixel } from 'common/pixel';

export class GameClassic extends Game {
    private nbDiffToWin: number;
    private diffsFoundByPlayer: { [key: string]: number };

    // Information about ongoing match
    private dataProp: Omit<GameInstance, 'nbDiff' | 'players'>;

    constructor(gameInfo: GameInfo, players: Player[], hintPenalty: number) {
        super(GameType.Classic, players, hintPenalty);
        this.archive.gameTitle = gameInfo.title;
        this.time = 0;

        this.dataProp = {
            title: gameInfo.title,
            isHard: gameInfo.isHard,
            gameMode: GameType.Classic,
            hintPenalty,
        };
        this.differences = gameInfo.differences;

        this.nbDiffToWin = this.differences.length / players.length;
        this.diffsFoundByPlayer = {};
        players.forEach((player) => (this.diffsFoundByPlayer[player.socket] = 0));
    }

    get data(): GameInstance {
        return { ...this.dataProp, nbDiff: this.differences.length, players: Object.values(this.players) };
    }

    async checkClick(pixel: Pixel, socketId: string): Promise<void> {
        if (!this.isPlayerInGame(socketId)) return;
        const diffCoord = this.findDifference(pixel, socketId);

        if (!diffCoord) return; // If no difference is found, game hasn't ended

        this.differences = this.differences.filter((difference: Pixel[]) => difference !== diffCoord); // Removes difference from left to find
        this.diffsFoundByPlayer[socketId]++; // Increments player counter
        this.gameManager.emitTo(`differenceFound${this.players[socketId]}`, diffCoord, this.room);
        const gameFinished = this.diffsFoundByPlayer[socketId] >= this.nbDiffToWin;
        if (gameFinished) {
            const position = await (await this.dataService).getPositionFromTime(this.archive.gameTitle, Math.floor(this.time), this.isMultiplayer);
            const details =
                (this.isMultiplayer ? `${this.players[socketId]} a` : 'Vous avez') +
                ' trouvé toutes les différences' +
                (position !== NOT_TOP_THREE ? ' avec le meilleur temps #' + position + '!' : '!');
            this.gameManager.emitTo(
                'gameFinished',
                {
                    prompt: 'Nous avons un gagnant!',
                    details,
                },
                this.room,
            );
            this.archive.isPlayer1 = this.players[socketId] === this.archive.p1Name;
            this.removeGame();
        }
    }

    abandon(socketId: string): void {
        if (!this.isPlayerInGame(socketId)) return;
        this.archive.isPlayer1 = true;
        if (this.isMultiplayer) {
            this.gameManager.emitTo('gameFinished', { prompt: 'Fin de la partie.', details: 'Vous avez gagné par forfait.' }, this.room);
            this.gameManager.emitTo('serverMessage', this.players[socketId] + ' a abandonné la partie', this.room);
            this.archive.isPlayer1 = this.players[socketId] === this.archive.p1Name;
        }
        this.archive.hasAbandoned = true;
        this.removeGame();
    }

    protected updateTime(n: number): void {
        this.time += n;
        this.gameManager.emitTo('gameTimeUpdated', Math.round(this.time * SECONDS_TO_MILLISECONDS), this.room);
    }
}
