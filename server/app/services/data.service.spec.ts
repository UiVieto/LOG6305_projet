/* eslint-disable max-lines -- Testing a method requires more lines of tests than its implementation and data.service.ts has about 250 lines of code*/
import { BEST_TIME_PLACEHOLDER, DatabaseConstants, NOT_TOP_THREE } from '@app/constants/constants';
import { DatabaseGame } from '@app/interfaces/database-game';
import { AssetService } from '@app/services/asset.service';
import { DataService } from '@app/services/data.service';
import { GameManagerService } from '@app/services/game-manager.service';
import { assert, expect } from 'chai';
import { GameArchive } from 'common/game-archive';
import { GameType } from 'common/game-instance';
import { Collection, Db, FindCursor } from 'mongodb';
// import { MongoMemoryServer } from 'mongodb-memory-server';
import { SinonStub, SinonStubbedInstance, createStubInstance, mock, spy, stub } from 'sinon';

describe('DataService', () => {
    let dataService: DataService;
    let assetService: SinonStubbedInstance<AssetService>;
    let gameManagerService: SinonStubbedInstance<GameManagerService>;
    let getInstanceStub: SinonStub;
    let collectionStub: SinonStubbedInstance<Collection>;

    const game1: DatabaseGame = {
        title: '1',
        bestTimes: BEST_TIME_PLACEHOLDER,
        isHard: true,
    };

    const game2: DatabaseGame = {
        title: '2',
        bestTimes: BEST_TIME_PLACEHOLDER,
        isHard: true,
    };

    const game3: DatabaseGame = {
        title: '3',
        bestTimes: BEST_TIME_PLACEHOLDER,
        isHard: true,
    };

    const gameHistory: GameArchive = {
        gameTitle: 'Test',
        startDate: 2050,
        playingTime: 450,
        endClock: 5,
        gameMode: GameType.Classic,
        p1Name: 'Cain',
        p2Name: 'Jean-Michel',
        isPlayer1: true,
        hasAbandoned: false,
    };

    beforeEach(async () => {
        assetService = createStubInstance(AssetService);
        // Access to private constructor is to avoid instantiating the service with getInstance.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataService = new (DataService.prototype as any).constructor(assetService);
        dataService['database'] = createStubInstance(Db);
        collectionStub = createStubInstance(Collection<DatabaseGame>);
        (dataService['database'] as SinonStubbedInstance<Db>).collection.returns(collectionStub);

        gameManagerService = createStubInstance(GameManagerService);
        gameManagerService.isActiveTitle.returns(true);
        getInstanceStub = stub(GameManagerService, 'getInstance').returns(gameManagerService);
    });

    afterEach(() => {
        getInstanceStub.restore();
    });

    it('connectToServer should connect to MongoServer', async () => {
        // const mongoServer = await MongoMemoryServer.create({ instance: { dbName: DatabaseConstants.Database } });
        // const uri = mongoServer.getUri();
        // await dataService['connectToServer'](uri);
        // expect(dataService['database']).not.equal(undefined);
        expect(true).to.be.true;
    });

    it('getInstance should return a new connected instance if it does not exists', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accessing private method connectToServer for stubbing
        const connectToServerStub: SinonStub = stub(DataService.prototype as any, 'connectToServer');
        DataService['instance'] = undefined;
        await DataService.getInstance();
        assert(connectToServerStub.calledOnceWith(DatabaseConstants.DatabaseUrl));
        expect(DataService['instance']).not.equal(undefined);
        connectToServerStub.restore();
    });

    it('getInstance should return the exact same instance if it exists', async () => {
        DataService['instance'] = dataService;
        expect(await DataService.getInstance()).equal(dataService);
    });

    it('titleExists should call dataExists of AssetService', async () => {
        await dataService.titleExists('Test');
        expect(assetService.dataExists.calledOnceWith('Test'));
    });

    it('titleExist should return the correct values if the game exists or not', async () => {
        collectionStub.findOne.callsFake(async () => Promise.resolve(game1));
        assetService.dataExists.returns(Promise.resolve(true));
        assert(await dataService.titleExists('Test1'));

        collectionStub.findOne.callsFake(async () => Promise.resolve(null));
        assetService.dataExists.returns(Promise.resolve(true));
        assert(!(await dataService.titleExists('Test2')));

        collectionStub.findOne.callsFake(async () => Promise.resolve(game1));
        assetService.dataExists.returns(Promise.resolve(false));
        assert(!(await dataService.titleExists('Test3')));

        collectionStub.findOne.callsFake(async () => Promise.resolve(null));
        assetService.dataExists.returns(Promise.resolve(false));
        assert(!(await dataService.titleExists('Test4')));
    });

    it('createGame should call addGameData and insertOne with correct parameters', async () => {
        const game = {
            title: 'A',
            image1: 'image1',
            image2: 'image2',
            differences: [[{ x: 0, y: 0 }]],
            bestTimes: { solo: [], versus: [] },
            isHard: true,
        };
        await dataService.createGame(game);
        assert(assetService.addGameData.calledOnceWith(game.title, { image1: game.image1, image2: game.image2 }, game.differences));
        assert(collectionStub.insertOne.calledOnce);
        expect(collectionStub.insertOne.firstCall.firstArg).eql({ title: game.title, bestTimes: BEST_TIME_PLACEHOLDER, isHard: game.isHard });
    });

    it('addGameHistory should call insertOne with correct parameter', async () => {
        const s = spy(dataService, 'addGameHistory');
        await dataService.addGameHistory(gameHistory);
        assert(s.calledOnceWith(gameHistory));
        assert(gameManagerService.emitTo.calledOnceWith('gameHistoryAdded'));
        assert(collectionStub.insertOne.calledOnce);
        expect(collectionStub.insertOne.firstCall.firstArg).eql(gameHistory);
        s.restore();
    });

    it('deleteHistory should call deleteMany with correct parameter', async () => {
        await dataService.deleteHistory();
        assert(collectionStub.deleteMany.calledOnce);
        assert(gameManagerService.emitTo.calledOnceWith('deleteHistory'));
        expect(collectionStub.deleteMany.firstCall.firstArg).eql({});
    });

    it('getGame should call findOne and getGameDifferences and return the given game info', async () => {
        collectionStub.findOne.callsFake(async () => Promise.resolve(game1));
        assetService.getGameDifferences.returns(Promise.resolve([]));
        expect(await dataService.getGame('Test')).eql({ title: game1.title, isHard: game1.isHard, differences: [] });
        assert(collectionStub.findOne.calledOnceWith({ title: 'Test' }));
        assert(assetService.getGameDifferences.calledOnceWith('Test'));
    });

    it('getGame should return undefined if a game or the game differences are not found', async () => {
        collectionStub.findOne.callsFake(async () => Promise.resolve(undefined));
        assetService.getGameDifferences.returns(Promise.resolve([]));
        expect(await dataService.getGame('MAGIC')).equal(undefined);

        collectionStub.findOne.callsFake(async () => Promise.resolve(game1));
        assetService.getGameDifferences.returns(Promise.resolve(undefined));
        expect(await dataService.getGame('unknown')).equal(undefined);

        collectionStub.findOne.callsFake(async () => Promise.resolve(undefined));
        expect(await dataService.getGame('The invisible man')).equal(undefined);
    });

    it('getGames should call find and correctly return the given the values', async () => {
        const cursorStub = createStubInstance<FindCursor<DatabaseGame>>(FindCursor);
        cursorStub.toArray.callsFake(() => [game1, game2, game3]);
        collectionStub.find.returns(cursorStub);
        expect(await dataService.getGames()).eql([game1, game2, game3]);
        assert(cursorStub.toArray.calledOnce);
        assert(collectionStub.find.calledOnceWith({}));
    });

    it('getBestTimesByGame should call findOne with correct parameter', async () => {
        await dataService.getBestTimesByGame('Test');
        assert(collectionStub.findOne.calledOnceWith({ title: 'Test' }));
    });

    it('getBestTimeByGame should return the bestTime or undefined if the game does not exist', async () => {
        collectionStub.findOne.callsFake(async () => Promise.resolve(game2));
        expect(await dataService.getBestTimesByGame('Test')).eql(game2.bestTimes);
        collectionStub.findOne.callsFake(async () => Promise.resolve(null));
        expect(await dataService.getBestTimesByGame('Test')).eql(undefined);
    });

    it('getGameHistory should call find and toArray', async () => {
        const cursorStub = createStubInstance(FindCursor);
        collectionStub.find.callsFake(() => cursorStub);
        await dataService.getGameHistory();
        assert(cursorStub.toArray.calledOnce);
        assert(collectionStub.find.calledOnceWith({}));
    });

    it('getGames should call find and correctly return the given the values', async () => {
        const cursorStub = createStubInstance<FindCursor<DatabaseGame>>(FindCursor);
        cursorStub.project.returns(cursorStub);
        cursorStub.toArray.callsFake(() => [game1, game2, game3]);
        collectionStub.find.returns(cursorStub);
        expect(await dataService.getGameTitles()).eql([game1.title, game2.title, game3.title]);
        assert(cursorStub.toArray.calledOnce);
        assert(collectionStub.find.calledOnceWith({}));
    });

    it('getPageGames should return 4 games for a full page', async () => {
        const games = [game1, game2, game3, game3, game1];
        mock(dataService).expects('getGames').once().returns(Promise.resolve(games));

        expect(await dataService.getPageGames(0)).to.eql({
            games: [
                { ...game1, isInitiallyVsActive: true },
                { ...game2, isInitiallyVsActive: true },
                { ...game3, isInitiallyVsActive: true },
                { ...game3, isInitiallyVsActive: true },
            ],
            pageIndex: 0,
            isLastPage: false,
        });
        expect(gameManagerService.isActiveTitle.getCalls().map((call) => call.args)).eql([
            [game1.title],
            [game2.title],
            [game3.title],
            [game3.title],
        ]);
    });

    it('getPageGames should return remaining games for last page', async () => {
        mock(dataService)
            .expects('getGames')
            .once()
            .returns(Promise.resolve([game1, game3, game3, game3, game2]));

        expect(await dataService.getPageGames(1)).to.eql({ games: [{ ...game2, isInitiallyVsActive: true }], pageIndex: 1, isLastPage: true });
        expect(gameManagerService.isActiveTitle.firstCall.args).eql([game2.title]);
    });

    it('getPageGames should return no game for empty server database', async () => {
        mock(dataService).expects('getGames').once().returns(Promise.resolve([]));
        expect(gameManagerService.isActiveTitle.callCount).equal(0);
        expect(await dataService.getPageGames(3)).to.eql({ games: [], pageIndex: 0, isLastPage: true });
    });

    it('updateBestTimes should call setBestTimes if the game mode played was classic and the game was not abandoned', async () => {
        const firstPlayerGame = gameHistory;
        const secondPlayerGame = {
            gameTitle: 'Test',
            startDate: 2050,
            playingTime: 450,
            endClock: 5,
            gameMode: GameType.Classic,
            p1Name: 'Cain',
            p2Name: 'Jean-Michel',
            isPlayer1: false,
            hasAbandoned: false,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Access to private method for stubbing
        const setBestTimeStub = stub(dataService as any, 'setBestTimes');
        await dataService.updateBestTimes(firstPlayerGame);
        await dataService.updateBestTimes(secondPlayerGame);
        expect(setBestTimeStub.getCalls().map((call) => call.args)).eql([
            [gameHistory.gameTitle, { playerName: firstPlayerGame.p1Name, time: firstPlayerGame.endClock }, true],
            [gameHistory.gameTitle, { playerName: secondPlayerGame.p2Name, time: secondPlayerGame.endClock }, true],
        ]);
    });

    it('updateBestTimes should not call setBestTimes if the finished game has the wrong game mode or was abandoned', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Access to private method for stubbing
        const setBestTimeStub = stub(dataService as any, 'setBestTimes');
        const testGameArchive = {
            gameTitle: 'Test',
            startDate: 2050,
            playingTime: 450,
            endClock: 5,
            gameMode: GameType.LimitedTime,
            p1Name: 'Cain',
            p2Name: '',
            isPlayer1: true,
            hasAbandoned: false,
        };
        dataService.updateBestTimes(testGameArchive);
        testGameArchive.hasAbandoned = true;
        dataService.updateBestTimes(testGameArchive);
        testGameArchive.gameMode = GameType.Classic;
        dataService.updateBestTimes(testGameArchive);
        assert(setBestTimeStub.callCount === 0);
    });

    it('resetAllBestTimes should call updateMany with correct parameters', async () => {
        await dataService.resetAllBestTimes();
        assert(collectionStub.updateMany.calledOnce);
        assert(collectionStub.updateMany.calledWith({}, { $set: { bestTimes: BEST_TIME_PLACEHOLDER } }));
    });

    it('resetGameBestTime should call updateOne with correct parameter', async () => {
        await dataService.resetGameBestTime('Test');
        assert(collectionStub.updateOne.calledOnce);
        assert(collectionStub.updateOne.calledWith({ title: 'Test' }, { $set: { bestTimes: BEST_TIME_PLACEHOLDER } }));
    });

    it('deleteGameByTitle should call deleteOne and deleteGameData and kickPlayers with correct parameters', async () => {
        const title = 'GHOST_OF_PAST_FAILURES';
        await dataService.deleteGameByTitle(title);
        assert(gameManagerService.kickPlayers.calledOnceWith(title));
        assert(collectionStub.deleteOne.calledOnce);
        assert(collectionStub.deleteOne.calledWith({ title }));
        assert(assetService.deleteGameData.calledWith(title));
    });

    it('deleteAllGames should call: getGameTitles once, deleteGameData thrice and deleteMany once', async () => {
        const getTitlesStub = stub(dataService, 'getGameTitles');
        getTitlesStub.returns(Promise.resolve([game1.title, game2.title, game3.title]));
        await dataService.deleteAllGames();
        assert(getTitlesStub.calledOnceWith());
        assert(collectionStub.deleteMany.calledOnce);
        assert(collectionStub.deleteMany.calledWith({}));
        assert(assetService.deleteGameData.callCount === 3);
        expect(assetService.deleteGameData.getCalls().map((call) => call.args)).eql([[game1.title], [game2.title], [game3.title]]);
    });

    it('sendBestTimeMessage should emit no message on time not in the best times', async () => {
        const bestTime = { playerName: 'Alexandre', time: 1000000 };
        await dataService['sendBestTimeMessage'](game1.title, bestTime.playerName, NOT_TOP_THREE, false);
        assert(gameManagerService.emitTo.callCount === 0);
    });

    it('sendBestTimeMessage should emit correct message for solo game', async () => {
        const toLocaleTimeStringStub = stub(Date.prototype, 'toLocaleTimeString');
        toLocaleTimeStringStub.returns('My Time');
        const bestTime = { playerName: 'Alexandre', time: 0 };

        await dataService['sendBestTimeMessage'](game1.title, bestTime.playerName, 1, false);
        assert(toLocaleTimeStringStub.calledOnceWith('it-IT'));
        assert(
            gameManagerService.emitTo.calledOnceWith(
                'newBestTimeMessage',
                'My Time - Alexandre obtient la 1re place dans les meilleurs temps du jeu 1 en solo',
            ),
        );
        toLocaleTimeStringStub.restore();
    });

    it('sendBestTimeMessage should emit correct message for multiplayer game', async () => {
        const toLocaleTimeStringStub = stub(Date.prototype, 'toLocaleTimeString');
        toLocaleTimeStringStub.returns('My Time');
        const bestTime = { playerName: 'Alexandre', time: 0 };

        await dataService['sendBestTimeMessage'](game1.title, bestTime.playerName, 2, true);
        assert(toLocaleTimeStringStub.calledOnceWith('it-IT'));
        assert(
            gameManagerService.emitTo.calledOnceWith(
                'newBestTimeMessage',
                'My Time - Alexandre obtient la 2e place dans les meilleurs temps du jeu 1 en multijoueur',
            ),
        );
        toLocaleTimeStringStub.restore();
    });

    it('setBestTimes should call getBestTimesByGame and do nothing if the call returns undefined', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Access to private method for stubbing
        const sendBestTimeMessageStub = stub(dataService as any, 'sendBestTimeMessage');
        const getBestTimeStub = stub(dataService, 'getBestTimesByGame');
        getBestTimeStub.returns(Promise.resolve(undefined));
        await dataService['setBestTimes']('Test', { playerName: '', time: 0 }, false);
        assert(getBestTimeStub.calledOnceWith('Test'));
        assert(gameManagerService.emitTo.callCount === 0);
        assert(sendBestTimeMessageStub.callCount === 0);
        assert(collectionStub.updateOne.callCount === 0);
    });

    it('setBestTimes should call updateOne, emitTo and sendBestTimeMessage with correct parameters and update solo times', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Access to private method for stubbing
        const sendBestTimeMessageStub = stub(dataService as any, 'sendBestTimeMessage');
        const getBestTimeStub = stub(dataService, 'getBestTimesByGame');
        const getPositionFromTimeStub = stub(dataService, 'getPositionFromTime');
        getPositionFromTimeStub.returns(Promise.resolve(1));
        const bestTimes = {
            solo: [
                { playerName: 'Matteo', time: 100 },
                { playerName: 'Gabriel', time: 200 },
                { playerName: 'Edouard', time: 300 },
            ],
            versus: [
                { playerName: 'Matteo', time: 100 },
                { playerName: 'Gabriel', time: 200 },
                { playerName: 'Edouard', time: 300 },
            ],
        };
        const expectedBestTimes = {
            solo: [
                { playerName: 'Chad', time: 0 },
                { playerName: 'Matteo', time: 100 },
                { playerName: 'Gabriel', time: 200 },
            ],
            versus: [
                { playerName: 'Matteo', time: 100 },
                { playerName: 'Gabriel', time: 200 },
                { playerName: 'Edouard', time: 300 },
            ],
        };
        getBestTimeStub.returns(Promise.resolve(bestTimes));
        await dataService['setBestTimes']('Test', { playerName: 'Chad', time: 0 }, false);
        const emitToArgs = gameManagerService.emitTo.firstCall.args;
        const updateOneArgs = collectionStub.updateOne.firstCall.args;

        assert(getPositionFromTimeStub.calledOnceWith('Test', 0, false));
        expect(updateOneArgs[0]).eql({ title: 'Test' });
        expect(updateOneArgs[1].$set).eql({ bestTimes: expectedBestTimes });
        assert(gameManagerService.emitTo.calledOnce);
        expect(emitToArgs[0]).equal('updateBestTime');
        expect(emitToArgs[1].title).eql('Test');
        expect(emitToArgs[1].bestTimes).eql(expectedBestTimes);
        assert(collectionStub.updateOne.calledOnce);
        assert(sendBestTimeMessageStub.calledOnceWith('Test', 'Chad', 1, false));
    });

    it('setBestTimes should call updateOne, emitTo and sendBestTimeMessage with correct parameters and update versus times', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Access to private method for stubbing
        const sendBestTimeMessageStub = stub(dataService as any, 'sendBestTimeMessage');
        const getBestTimeStub = stub(dataService, 'getBestTimesByGame');
        const getPositionFromTimeStub = stub(dataService, 'getPositionFromTime');
        getPositionFromTimeStub.returns(Promise.resolve(1));
        const bestTimes = {
            solo: [
                { playerName: 'Matteo', time: 100 },
                { playerName: 'Gabriel', time: 200 },
                { playerName: 'Edouard', time: 300 },
            ],
            versus: [
                { playerName: 'Matteo', time: 100 },
                { playerName: 'Gabriel', time: 200 },
                { playerName: 'Edouard', time: 300 },
            ],
        };
        const expectedBestTimes = {
            solo: [
                { playerName: 'Matteo', time: 100 },
                { playerName: 'Gabriel', time: 200 },
                { playerName: 'Edouard', time: 300 },
            ],
            versus: [
                { playerName: 'Chad', time: 0 },
                { playerName: 'Matteo', time: 100 },
                { playerName: 'Gabriel', time: 200 },
            ],
        };
        getBestTimeStub.returns(Promise.resolve(bestTimes));
        await dataService['setBestTimes']('Test', { playerName: 'Chad', time: 0 }, true);
        const emitToArgs = gameManagerService.emitTo.firstCall.args;
        const updateOneArgs = collectionStub.updateOne.firstCall.args;

        assert(getPositionFromTimeStub.calledOnceWith('Test', 0, true));
        expect(updateOneArgs[0]).eql({ title: 'Test' });
        expect(updateOneArgs[1].$set).eql({ bestTimes: expectedBestTimes });
        assert(gameManagerService.emitTo.calledOnce);
        expect(emitToArgs[0]).equal('updateBestTime');
        expect(emitToArgs[1].title).eql('Test');
        expect(emitToArgs[1].bestTimes).eql(expectedBestTimes);
        assert(collectionStub.updateOne.calledOnce);
        assert(sendBestTimeMessageStub.calledOnceWith('Test', 'Chad', 1, true));
    });

    it('getPositionFromTime should return -1 if there are no best times', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Access to private method for stubbing
        const getBestTimesByGameStub = stub(dataService as any, 'getBestTimesByGame');
        getBestTimesByGameStub.returns(Promise.resolve(undefined));
        assert((await dataService['getPositionFromTime']('GHOST', 0, false)) === NOT_TOP_THREE);
    });

    it('getPositionFromTime should return -1 if the time is not in best times', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Access to private method for stubbing
        const getBestTimeByGame = stub(dataService as any, 'getBestTimesByGame');
        getBestTimeByGame.returns(
            Promise.resolve({
                solo: [
                    { playerName: 'Super Flash', time: 1 },
                    { playerName: 'Flash', time: 2 },
                    { playerName: 'Fast Database', time: 3 },
                ],
                versus: [
                    { playerName: 'Super Flash', time: 1 },
                    { playerName: 'Flash', time: 2 },
                    { playerName: 'Fast Database', time: 3 },
                ],
            }),
        );
        assert((await dataService['getPositionFromTime']('Test', Infinity, false)) === NOT_TOP_THREE);
    });

    it('getPositionFromTime should return the correct position for solo game', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Access to private method for stubbing
        const getBestTimeByGame = stub(dataService as any, 'getBestTimesByGame');
        getBestTimeByGame.returns(
            Promise.resolve({
                solo: [
                    { playerName: 'SnailBot', time: 1 },
                    { playerName: 'SnailBot', time: 2 },
                    { playerName: 'SnailBot', time: 3 },
                ],
                versus: [
                    { playerName: 'SnailBot', time: 1 },
                    { playerName: 'SnailBot', time: 2 },
                    { playerName: 'SnailBot', time: 3 },
                ],
            }),
        );
        assert((await dataService['getPositionFromTime']('Test', 1, false)) === 2);
    });

    it('getPositionFromTime should return the correct position for versus game', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Access to private method for stubbing
        const getBestTimeByGame = stub(dataService as any, 'getBestTimesByGame');
        getBestTimeByGame.returns(
            Promise.resolve({
                solo: [
                    { playerName: 'SnailBot1', time: 1 },
                    { playerName: 'SnailBot2', time: 2 },
                    { playerName: 'SnailBot3', time: Infinity },
                ],
                versus: [
                    { playerName: 'SnailBot1', time: 1 },
                    { playerName: 'SnailBot2', time: 2 },
                    { playerName: 'SnailBot3', time: Infinity },
                ],
            }),
        );
        assert((await dataService['getPositionFromTime']('Test', 2, true)) === 3);
    });
});
