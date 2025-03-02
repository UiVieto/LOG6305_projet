/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { SECONDS_TO_MILLISECONDS } from '@app/constants/constants';
import { GameInfo } from '@app/interfaces/game-info';
import { Player } from '@app/interfaces/player';
import { DataService } from '@app/services/data.service';
import { GameManagerService } from '@app/services/game-manager.service';
import { assert, expect } from 'chai';
import { GameType } from 'common/game-instance';
import { GameSettings } from 'common/settings';
import { describe } from 'mocha';
import * as sinon from 'sinon';
import { GameLimitedTime } from './game-limited-time';

const HINT_PENALTY = 5;
describe('Game Limited Time test', () => {
    let gameL: GameLimitedTime;
    let gameInfo: GameInfo[];
    let player: Player[];
    let gameSettings: GameSettings;
    let gameTitles: string[];
    let stubGetGame: sinon.SinonStub;

    beforeEach(() => {
        gameSettings = {
            initialTime: 60,
            penaltyTime: HINT_PENALTY,
            bonusTime: 10,
        };
        gameTitles = ['test', 'yo'];
        gameInfo = [
            {
                title: gameTitles[0],
                isHard: false,
                differences: [
                    [
                        { x: 0, y: 0 },
                        { x: 1, y: 0 },
                    ],
                    [
                        { x: 2, y: 0 },
                        { x: 2, y: 1 },
                    ],
                    [
                        { x: 20, y: 10 },
                        { x: 20, y: 11 },
                    ],
                ],
            },

            {
                title: gameTitles[1],
                isHard: true,
                differences: [
                    [
                        { x: 0, y: 0 },
                        { x: 1, y: 0 },
                    ],
                    [
                        { x: 2, y: 2 },
                        { x: 2, y: 3 },
                    ],
                ],
            },
        ];
        player = [
            {
                socket: '_s0cK3t1d_-_t3st',
                name: 'test-p1',
            },
        ];
        stubGetGame = sinon.stub(DataService.prototype, 'getGame').callsFake(async (n: string) => {
            return Promise.resolve(gameInfo.find((g) => g.title === n));
        });
        gameL = new GameLimitedTime(gameTitles, player, gameSettings);
    });

    afterEach(() => {
        gameL['stopTimer'];
        sinon.restore();
    });

    it('should create a game', () => {
        expect(gameL).to.exist;
    });

    it('updateTime should remove to the time and emit it to the room', () => {
        const spy = sinon.spy(GameManagerService.prototype, 'emitTo');
        expect(gameL['time']).to.equal(gameSettings.initialTime);
        gameL['updateTime'](HINT_PENALTY);
        expect(gameL['time']).to.equal(gameSettings.initialTime - HINT_PENALTY);
        assert(spy.called);
        assert(spy.calledWith('gameTimeUpdated', SECONDS_TO_MILLISECONDS * (gameSettings.initialTime - HINT_PENALTY), gameL.room));
    });

    it('updateTime should not go below 0 and should end the game', () => {
        const spy = sinon.spy(GameManagerService.prototype, 'emitTo');
        const stubR = sinon.stub(gameL, 'removeGame' as any).callsFake(() => {
            return;
        });
        expect(gameL['time']).to.equal(gameSettings.initialTime);
        gameL['updateTime'](gameSettings.initialTime + HINT_PENALTY);
        expect(gameL['time']).to.equal(0);
        assert(spy.calledTwice);
        assert(spy.firstCall.calledWith('gameTimeUpdated', 0, gameL.room));
        assert(spy.secondCall.calledWith('gameFinished', { prompt: 'Vous avez perdu!', details: 'Le temps est écoulé.' }, gameL.room));
        assert(stubR.called);
    });

    it('abandon should do nothing if the player is not in game', () => {
        const spyInGame = sinon.spy(gameL, 'isPlayerInGame');
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = sinon.spy(gameL, 'removeGame' as any);
        gameL.abandon('fake-socket');
        expect(gameL['archive'].hasAbandoned).to.be.false;
        expect(gameL['archive'].isPlayer1).to.be.true;
        assert(spyInGame.called);
        assert(spyEmit.notCalled);
        assert(spy.notCalled);
    });

    it('abandon should set the hasAbandoned and isPlayer1 property to true in solo', () => {
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = sinon.spy(gameL, 'removeGame' as any);
        expect(gameL['archive'].hasAbandoned).to.be.false;
        gameL.abandon(player[0].socket);
        expect(gameL['archive'].hasAbandoned).to.be.true;
        expect(gameL['archive'].isPlayer1).to.be.true;
        assert(spyEmit.called);
        assert(spyEmit.calledWith('serverMessage', player[0].name + ' a abandonné la partie', gameL.room));
        assert(spy.called);
    });

    it('abandon should set the hasAbandoned to true and isPlayer1 property to the corresponding player in 1v1', () => {
        player.push({ socket: 'p2-socket-fake', name: 'test-p2' });
        gameL = new GameLimitedTime(gameTitles, player, gameSettings);
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = sinon.spy(gameL, 'removeGame' as any);
        expect(gameL['archive'].hasAbandoned).to.be.false;
        const playerId = 1;
        gameL.abandon(player[playerId].socket);
        expect(gameL['archive'].hasAbandoned).to.be.true;
        expect(gameL['archive'].isPlayer1).to.be.equal(playerId !== 1);
        expect(gameL['isPlayerInGame'](player[playerId].socket)).to.be.false;
        assert(spyEmit.calledTwice);
        assert(spyEmit.firstCall.calledWith('serverMessage', player[playerId].name + ' a abandonné la partie', gameL.room));
        assert(spyEmit.secondCall.calledWith('playerLeft', [player[0].name], gameL.room));
        assert(spy.notCalled);
    });

    it('start should return false if there is no game to play', async () => {
        const stub = sinon.stub(gameL, 'getNextGameInfo' as any).callsFake(async () => {
            return Promise.resolve(undefined);
        });
        const spy = sinon.spy(gameL, 'stopTimer' as any);
        const result = await gameL.start();
        expect(result).to.be.false;
        assert(stub.called);
        assert(spy.called);
    });

    it('start should return a game instance if there is a game to play', async () => {
        const stub = sinon.stub(gameL, 'getNextGameInfo' as any).callsFake(async () => {
            return Promise.resolve(gameInfo[0]);
        });
        const expectedGameInstance = {
            title: gameInfo[0].title,
            isHard: gameInfo[0].isHard,
            gameMode: GameType.LimitedTime,
            nbDiff: gameInfo[0].differences.length,
            players: [player[0].name],
            hintPenalty: HINT_PENALTY,
        };
        const result = await gameL.start();
        expect(result).to.be.eql(expectedGameInstance);
        assert(stub.called);
    });

    it('getNextGameInfo should return undefined if there is no game to play', async () => {
        gameL['gameTitles'] = [];
        const result = await gameL['getNextGameInfo']();
        expect(result).to.be.undefined;
    });

    it('getNextGameInfo should return a game info if there is a game to play', async () => {
        const stubRandom = sinon.stub(Math, 'random').callsFake(() => {
            return 0;
        });
        const length = gameTitles.length;
        expect(gameL['gameTitles'].length).to.be.equal(length);
        const result = await gameL['getNextGameInfo']();
        expect(result).to.be.equal(gameInfo[0]);
        expect(gameL['gameTitles'].length).to.be.equal(length - 1);
        assert(stubGetGame.called);
        assert(stubRandom.called);
    });

    it('checkClick should do nothing if the player is not in game', async () => {
        const pixel = { x: 0, y: 0 };
        const spy = sinon.spy(gameL, 'isPlayerInGame');
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        const spyFD = sinon.spy(gameL, 'findDifference' as any);
        await gameL.checkClick(pixel, 'fake-socket');
        assert(spy.called);
        assert(spyEmit.notCalled);
        assert(spyFD.notCalled);
    });

    it('checkClick should do nothing on a error click', async () => {
        const pixel = { x: 40, y: 0 };
        const stub = sinon.stub(gameL, 'findDifference' as any).callsFake(() => {
            return undefined;
        });
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        await gameL.checkClick(pixel, player[0].socket);
        assert(stub.called);
        assert(spyEmit.notCalled);
    });

    it('checkClick should emit a gameFinished event if the game is finished', async () => {
        const pixel = { x: 0, y: 0 };
        const stub = sinon.stub(gameL, 'findDifference' as any).callsFake(() => {
            return { x: 0, y: 0 };
        });
        const stubNG = sinon.stub(gameL, 'getNextGameInfo' as any).callsFake(async () => {
            return Promise.resolve(undefined);
        });
        const stubRG = sinon.stub(gameL, 'removeGame' as any).callsFake(async () => {
            return;
        });
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        await gameL.checkClick(pixel, player[0].socket);
        assert(stub.called);
        assert(stubNG.called);
        assert(stubRG.called);
        assert(spyEmit.calledTwice);
        assert(spyEmit.firstCall.calledWith('differenceFound', undefined, gameL.room));
        assert(
            spyEmit.secondCall.calledWith('gameFinished', { prompt: 'Vous avez gagné!', details: 'Vous avez résolu toutes les fiches.' }, gameL.room),
        );
    });

    it('checkClick should emit a new gameInstance if the game is not finished', async () => {
        const pixel = { x: 0, y: 0 };
        const stub = sinon.stub(gameL, 'findDifference' as any).callsFake(() => {
            return { x: 0, y: 0 };
        });
        const stubNG = sinon
            .stub(gameL, 'getNextGameInfo' as any)
            .onFirstCall()
            .callsFake(async () => {
                return Promise.resolve(gameInfo[1]);
            })
            .callsFake(async () => {
                return Promise.resolve(gameInfo[0]);
            });
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        await gameL.checkClick(pixel, player[0].socket);
        assert(stub.called);
        assert(stubNG.called);

        assert(spyEmit.firstCall.calledWithMatch('gameTimeUpdated'));
        assert(spyEmit.secondCall.calledWithMatch('differenceFound'));
        assert(spyEmit.calledTwice);
    });
});
