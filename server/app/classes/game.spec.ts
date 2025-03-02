/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { SECONDS_TO_MILLISECONDS } from '@app/constants/constants';
import { DatabaseGame } from '@app/interfaces/database-game';
import { GameInfo } from '@app/interfaces/game-info';
import { Player } from '@app/interfaces/player';
import { AssetService } from '@app/services/asset.service';
import { DataService } from '@app/services/data.service';
import { GameManagerService } from '@app/services/game-manager.service';
import { assert, expect } from 'chai';
import { GameType } from 'common/game-instance';
import { describe } from 'mocha';
import { Collection, Db } from 'mongodb';
import * as sinon from 'sinon';
import { SinonStub, SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { GameClassic } from './game-classic';

const HINT_PENALTY = 5;
describe('Game abstract test', () => {
    let gameManagerService: SinonStubbedInstance<GameManagerService>;
    let getGMInstanceStub: SinonStub;
    let dataService: SinonStubbedInstance<DataService>;
    let getDSInstanceStub: SinonStub;
    let collectionStub: SinonStubbedInstance<Collection>;
    let gameC: GameClassic;
    let gameInfo: GameInfo;
    let player: Player[];
    let assetService: SinonStubbedInstance<AssetService>;
    beforeEach(() => {
        gameManagerService = createStubInstance(GameManagerService);
        getGMInstanceStub = stub(GameManagerService, 'getInstance').returns(gameManagerService);
        assetService = createStubInstance(AssetService);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataService = new (DataService.prototype as any).constructor(assetService);
        dataService['database'] = createStubInstance(Db);
        collectionStub = createStubInstance(Collection<DatabaseGame>);
        (dataService['database'] as SinonStubbedInstance<Db>).collection.returns(collectionStub);
        getDSInstanceStub = stub(DataService, 'getInstance').returns(Promise.resolve(dataService));
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
        getGMInstanceStub.restore();
        getDSInstanceStub.restore();
        sinon.restore();
    });

    it('isMultiplayer should return false if only 1 player is in the game', () => {
        expect(gameC.isMultiplayer).to.be.false;
    });

    it('isMultiplayer should return true if 2 players are in the game', () => {
        player.push({ socket: 'p2-socket-fake', name: 'test-p2' });
        gameC = new GameClassic(gameInfo, player, HINT_PENALTY);
        expect(gameC.isMultiplayer).to.be.true;
    });

    it('room getter should return the room name', () => {
        expect(gameC.room).to.equal(GameType.Classic + '-' + player[0].socket);
    });

    it('history getter should return the game history', () => {
        const expectedHistory = {
            gameTitle: gameInfo.title,
            startDate: gameC['archive'].startDate,
            playingTime: 0,
            endClock: 0,
            gameMode: GameType.Classic,
            p1Name: player[0].name,
            p2Name: '',
            isPlayer1: true,
            hasAbandoned: false,
        };
        expect(gameC.history).to.eql(expectedHistory);
    });

    it('dataService getter should return the the same instance', async () => {
        const gameService = await gameC['dataService'];
        const realService = await DataService.getInstance();
        expect(gameService).to.eql(realService);
    });

    it('gameManager getter should return the the same instance', () => {
        expect(gameC['gameManager']).to.eql(GameManagerService.getInstance());
    });

    it('isPlayerInGame should return true if the player is in the game (verified by socket.id not by name)', () => {
        expect(gameC.isPlayerInGame(player[0].socket)).to.be.true;
    });

    it('isPlayerInGame should return false if the player is not in the game (verified by socket.id not by name)', () => {
        expect(gameC.isPlayerInGame(player[0].name)).to.be.false;
    });

    it('sendMessage should send a message to the players of the game but not the host', () => {
        player.push({ socket: 'p2-socket-fake', name: 'test-p2' });
        gameC = new GameClassic(gameInfo, player, HINT_PENALTY);
        const message = 'test';
        gameC.sendMessage(player[0].socket, message);
        assert(gameManagerService.emitTo.calledWith('chatMessageToRoom', { sender: player[0].name, text: message }, player[1].socket));
    });

    it('sendMessage should not emit to anyone if sender not in game', () => {
        player.push({ socket: 'p2-socket-fake', name: 'test-p2' });
        gameC = new GameClassic(gameInfo, player, HINT_PENALTY);
        const message = 'test';
        gameC.sendMessage('1am-invalid-socket', message);
        expect(gameManagerService.emitTo.calledWith('chatMessageToRoom', { sender: player[0].name, text: message }, player[1].socket)).to.be.false;
        assert(gameManagerService.emitTo.notCalled);
    });

    it('sendMessage should not emit if sender alone in game', () => {
        const message = 'test';
        gameC.sendMessage(player[0].socket, message);
        assert(gameManagerService.emitTo.notCalled);
    });

    it('time should start at 0 and be incremented', (done) => {
        expect(Math.floor(gameC['time'])).to.equal(0);

        setTimeout(() => {
            expect(Math.floor(gameC['time'])).to.eql(1);
            assert(gameManagerService.emitTo.calledWithMatch('gameTimeUpdated'));

            done();
        }, SECONDS_TO_MILLISECONDS + SECONDS_TO_MILLISECONDS / 2);
    });

    it('stopTimer should stop the timer', (done) => {
        const spy = sinon.spy(global, 'clearInterval');
        gameC['stopTimer']();
        assert(spy.calledWith(gameC['timerId']));
        expect(gameC['time']).to.equal(0);
        setTimeout(() => {
            expect(gameC['time']).to.equal(0);
            expect(gameC['archive'].endClock).to.equal(0);
            done();
        }, SECONDS_TO_MILLISECONDS);
    });

    it('removeGame should remove the game from the game manager', () => {
        gameC['removeGame']();
        assert(gameManagerService.removeGame.calledWith(gameC));
    });

    it('removeGame should stop the timer', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spyStop = sinon.spy(gameC, 'stopTimer' as any);
        gameC['removeGame']();
        assert(spyStop.called);
    });

    it('removeGame should should modify the playing time', (done) => {
        const spyDate = sinon.spy(Date, 'now');
        setTimeout(() => {
            gameC['removeGame']();
            assert(spyDate.called);
            expect(gameC['archive'].playingTime).to.not.equal(0);
            done();
        }, SECONDS_TO_MILLISECONDS);
    });

    it('findDifference should return an array of differences if the pixel is a difference and notify the player', () => {
        const difference = gameC['findDifference']({ x: 0, y: 0 }, player[0].socket);
        expect(difference).to.eql(gameInfo.differences[0]);
        assert(gameManagerService.emitTo.calledWith('serverMessage', 'Différence trouvée', gameC['roomProp']));
    });

    it('findDifference should return an array of differences if the pixel is a difference and notify the players', () => {
        player.push({ socket: 'p2-socket-fake', name: 'test-p2' });
        gameC = new GameClassic(gameInfo, player, HINT_PENALTY);

        const difference = gameC['findDifference']({ x: 0, y: 0 }, player[0].socket);
        expect(difference).to.eql(gameInfo.differences[0]);
        assert(gameManagerService.emitTo.calledWith('serverMessage', 'Différence trouvée par ' + player[0].name, gameC['roomProp']));
    });

    it('findDifference should return undefined if the pixel is not a difference and notify the player and block the player', () => {
        const clickedPixel = { x: 10, y: 10 };
        const difference = gameC['findDifference'](clickedPixel, player[0].socket);
        expect(difference).to.be.undefined;
        assert(gameManagerService.emitTo.calledTwice);
        assert(gameManagerService.emitTo.firstCall.calledWith('errorClick', clickedPixel, player[0].socket));
        assert(gameManagerService.emitTo.secondCall.calledWith('serverMessage', 'Erreur', gameC['roomProp']));
    });

    it('findDifference should return undefined if the pixel is not a difference and notify the players and block the player', () => {
        player.push({ socket: 'p2-socket-fake', name: 'test-p2' });
        gameC = new GameClassic(gameInfo, player, HINT_PENALTY);
        const playerIndex = 1;
        const clickedPixel = { x: 10, y: 10 };
        const difference = gameC['findDifference'](clickedPixel, player[playerIndex].socket);
        expect(difference).to.be.undefined;
        assert(gameManagerService.emitTo.calledTwice);
        assert(gameManagerService.emitTo.firstCall.calledWith('errorClick', clickedPixel, player[playerIndex].socket));
        assert(gameManagerService.emitTo.secondCall.calledWith('serverMessage', 'Erreur par ' + player[playerIndex].name, gameC['roomProp']));
    });

    it('useClue should modify the time', () => {
        const time = gameC['time'];
        gameC['useClue'](player[0].socket);
        expect(gameC['time']).to.equal(time + HINT_PENALTY);
    });

    it('useClue should notify the players', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(gameC, 'updateTime' as any).callsFake(() => {
            return;
        });
        const spyDate = sinon.spy(Date.prototype, 'toLocaleTimeString');
        sinon.stub(Math, 'random').returns(0);
        gameC['useClue'](player[0].socket);
        assert(gameManagerService.emitTo.calledTwice);
        assert(gameManagerService.emitTo.firstCall.calledWith('cluePixelPos', gameInfo.differences[0], player[0].socket));
        assert(spyDate.called);
    });
});
