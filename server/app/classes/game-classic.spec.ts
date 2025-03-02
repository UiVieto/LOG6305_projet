/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { NOT_TOP_THREE, SECONDS_TO_MILLISECONDS } from '@app/constants/constants';
import { GameInfo } from '@app/interfaces/game-info';
import { Player } from '@app/interfaces/player';
import { DataService } from '@app/services/data.service';
import { GameManagerService } from '@app/services/game-manager.service';
import { assert, expect } from 'chai';
import { GameType } from 'common/game-instance';
import { describe } from 'mocha';
import * as sinon from 'sinon';
import { GameClassic } from './game-classic';

const HINT_PENALTY = 5;
describe('Game classique test', () => {
    let gameC: GameClassic;
    let gameInfo: GameInfo;
    let player: Player[];

    beforeEach(() => {
        gameInfo = {
            title: 'test',
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
        };
        player = [
            {
                socket: '_s0cK3t1d_-_t3st',
                name: 'test-p1',
            },
        ];
        gameC = new GameClassic(gameInfo, player, HINT_PENALTY);
    });

    afterEach(() => {
        gameC['stopTimer'];
        sinon.restore();
    });

    it('should create a game', () => {
        expect(gameC).to.exist;
    });

    it('Data getter should return the game data', () => {
        const expectedData = {
            title: gameInfo.title,
            isHard: false,
            gameMode: GameType.Classic,
            nbDiff: gameInfo.differences.length,
            players: [player[0].name],
            hintPenalty: HINT_PENALTY,
        };
        expect(gameC.data).to.deep.equal(expectedData);
    });

    it('updateTime should add to the time and emit it to the room', () => {
        const spy = sinon.spy(GameManagerService.prototype, 'emitTo');
        expect(gameC['time']).to.equal(0);
        gameC['updateTime'](HINT_PENALTY);
        expect(gameC['time']).to.equal(HINT_PENALTY);
        assert(spy.called);
        assert(spy.calledWith('gameTimeUpdated', gameC['time'] * SECONDS_TO_MILLISECONDS, gameC.room));
    });

    it('abandon should do nothing if the player is not in game', () => {
        const spyInGame = sinon.spy(gameC, 'isPlayerInGame');
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        const spy = sinon.spy(gameC, 'removeGame' as any);
        gameC.abandon('fake-socket');
        expect(gameC['archive'].hasAbandoned).to.be.false;
        expect(gameC['archive'].isPlayer1).to.be.true;
        assert(spyInGame.called);
        assert(spyEmit.notCalled);
        assert(spy.notCalled);
    });

    it('abandon should set the hasAbandoned and isPlayer1 property to true in solo', () => {
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        const spy = sinon.spy(gameC, 'removeGame' as any);
        expect(gameC['archive'].hasAbandoned).to.be.false;
        gameC.abandon(player[0].socket);
        expect(gameC['archive'].hasAbandoned).to.be.true;
        expect(gameC['archive'].isPlayer1).to.be.true;
        assert(spyEmit.notCalled);
        assert(spy.called);
    });

    it('abandon should set the hasAbandoned to true and isPlayer1 property to the corresponding player in 1v1', () => {
        player.push({ socket: 'p2-socket-fake', name: 'test-p2' });
        gameC = new GameClassic(gameInfo, player, HINT_PENALTY);
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        const spy = sinon.spy(gameC, 'removeGame' as any);
        expect(gameC['archive'].hasAbandoned).to.be.false;
        const playerId = 1;
        gameC.abandon(player[playerId].socket);
        expect(gameC['archive'].hasAbandoned).to.be.true;
        expect(gameC['archive'].isPlayer1).to.be.equal(playerId !== 1);
        const expectedFirstCall = { prompt: 'Fin de la partie.', details: 'Vous avez gagné par forfait.' };
        assert(spyEmit.calledTwice);
        assert(spyEmit.firstCall.calledWith('gameFinished', expectedFirstCall, gameC.room));
        assert(spyEmit.secondCall.calledWith('serverMessage', player[playerId].name + ' a abandonné la partie', gameC.room));
        assert(spy.called);
    });

    it('checkClick should not modify anything if the player is not in game', async () => {
        const spyInGame = sinon.spy(gameC, 'isPlayerInGame');
        const spy = sinon.spy(gameC, 'findDifference' as any);
        await gameC.checkClick({ x: 0, y: 0 }, 'fake-socket');
        assert(spyInGame.called);
        assert(spy.notCalled);
    });

    it('checkClick should not modify anything on an error', async () => {
        const stub = sinon.stub(gameC, 'findDifference' as any).callsFake(() => {
            return undefined;
        });
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        await gameC.checkClick({ x: 0, y: 0 }, player[0].socket);
        assert(spyEmit.notCalled);
        assert(stub.called);
    });

    it('checkClick should emit the correct message on a success', async () => {
        sinon.stub(gameC, 'findDifference' as any).callsFake(() => {
            return gameInfo.differences[0];
        });
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        const playerId = 0;
        await gameC.checkClick({ x: 0, y: 0 }, player[playerId].socket);
        assert(spyEmit.calledWith(`differenceFound${player[0].name}`, gameInfo.differences[0], gameC.room));
        expect(gameC['diffsFoundByPlayer'][player[0].socket]).to.deep.equal(1);
        expect(gameC['differences'].includes(gameInfo.differences[0])).to.be.false;
        expect(gameC['differences'].length).to.be.equal(gameInfo.differences.length - 1);
    });

    it('checkClick should emit the correct solo message on a success and end the game if all differences are found', async () => {
        const playerId = 0;
        gameInfo.differences = [gameInfo.differences[0]];
        gameC = new GameClassic(gameInfo, player, HINT_PENALTY);
        sinon.stub(gameC, 'findDifference' as any).callsFake(() => {
            return gameInfo.differences[0];
        });
        const stubRem = sinon.stub(gameC, 'removeGame' as any).callsFake(() => {
            return;
        });
        const stubPFT = sinon.stub(DataService.prototype, 'getPositionFromTime').callsFake(async () => {
            return Promise.resolve(NOT_TOP_THREE);
        });
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        await gameC.checkClick({ x: 0, y: 0 }, player[playerId].socket);
        assert(stubPFT.called);
        assert(stubRem.called);
        assert(spyEmit.calledTwice);
        assert(spyEmit.firstCall.calledWith(`differenceFound${player[0].name}`, gameInfo.differences[0], gameC.room));
        assert(
            spyEmit.secondCall.calledWith(
                'gameFinished',
                { prompt: 'Nous avons un gagnant!', details: 'Vous avez trouvé toutes les différences!' },
                gameC.room,
            ),
        );
        expect(gameC['diffsFoundByPlayer'][player[0].socket]).to.equal(1);
        expect(gameC['differences'].length).to.be.equal(0);
    });

    it('checkClick should emit the correct 1v1 message on a success and end the game if all differences are found', async () => {
        const playerId = 0;
        gameInfo.differences = [gameInfo.differences[0]];
        player.push({ socket: 'p2-socket-fake', name: 'test-p2' });
        gameC = new GameClassic(gameInfo, player, HINT_PENALTY);
        sinon.stub(gameC, 'findDifference' as any).callsFake(() => {
            return gameInfo.differences[0];
        });
        const stubRem = sinon.stub(gameC, 'removeGame' as any).callsFake(() => {
            return;
        });
        const pos = 1;
        const stubPFT = sinon.stub(DataService.prototype, 'getPositionFromTime').callsFake(async () => {
            return Promise.resolve(pos);
        });
        const spyEmit = sinon.spy(GameManagerService.prototype, 'emitTo');
        await gameC.checkClick({ x: 0, y: 0 }, player[playerId].socket);
        assert(stubPFT.called);
        assert(stubRem.called);
        assert(spyEmit.calledTwice);
        assert(spyEmit.firstCall.calledWith(`differenceFound${player[playerId].name}`, gameInfo.differences[0], gameC.room));
        assert(
            spyEmit.secondCall.calledWith(
                'gameFinished',
                {
                    prompt: 'Nous avons un gagnant!',
                    details: `${player[playerId].name} a` + ' trouvé toutes les différences avec le meilleur temps #' + pos + '!',
                },
                gameC.room,
            ),
        );
        expect(gameC['diffsFoundByPlayer'][player[playerId].socket]).to.equal(1);
        expect(gameC['differences'].length).to.be.equal(0);
    });
});
