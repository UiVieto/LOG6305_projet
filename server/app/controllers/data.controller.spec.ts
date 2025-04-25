import { Application } from '@app/app';
import { DataController } from '@app/controllers/data.controller';
import { DataService } from '@app/services/data.service';
import { assert, expect } from 'chai';
import { GameArchive } from 'common/game-archive';
import { GameType } from 'common/game-instance';
import { StatusCodes } from 'http-status-codes';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import * as supertest from 'supertest';
import { App } from 'supertest/types';
import { Container } from 'typedi';

describe('DataController', () => {
    let dataService: SinonStubbedInstance<DataService>;
    let expressApp: Express.Application;

    beforeEach(() => {
        dataService = createStubInstance(DataService);
        // Access to private static instance for giving a stubbed instance
        DataService['instance'] = dataService;
        const app = Container.get(Application);
        Object.defineProperty(app['dataController'], 'dataService', { value: dataService, writable: true });
        expressApp = app.app;
    });

    it('DataService getter should return the correct instance', async () => {
        const instance = await new DataController()['dataService'];
        assert(instance === dataService);
    });

    it('should send CREATED on createGame post request', async () => {
        dataService.createGame.returns(Promise.resolve());
        await supertest(expressApp as any as App)
            .post('/api/data/create')
            .expect(StatusCodes.CREATED);
        assert(dataService.createGame.calledOnce);
    });

    it('should send BAD_REQUEST on createGame error', async () => {
        dataService.createGame.returns(Promise.reject(new Error()));
        await supertest(expressApp as any as App)
            .post('/api/data/create')
            .catch(() => {
                expect(StatusCodes.BAD_REQUEST);
            });
        assert(dataService.createGame.calledOnce);
    });

    it('should send OK and true if title exists on get request', async () => {
        dataService.titleExists.returns(Promise.resolve(true));
        await supertest(expressApp as any as App)
            .get('/api/data/create/titleExists')
            .then((response) => {
                expect(StatusCodes.OK);
                expect(response).to.not.equal(undefined);
            });
        assert(dataService.titleExists.calledOnce);
    });

    it('should send BAD_REQUEST on titleExists error', async () => {
        dataService.titleExists.returns(Promise.reject(new Error()));
        await supertest(expressApp as any as App)
            .get('/api/data/create/titleExists')
            .catch(() => {
                expect(StatusCodes.BAD_REQUEST);
            });
        assert(dataService.titleExists.calledOnce);
    });

    it('should send NOT_FOUND on get request error', async () => {
        const error = new Error('Test');
        dataService.getPageGames.returns(Promise.reject(error));

        await supertest(expressApp as any as App)
            .get('/api/data/games')
            .catch((err) => {
                expect(StatusCodes.NOT_FOUND);
                expect(err).equal(error);
            });
        assert(dataService.getPageGames.calledOnce);
    });

    it('should send OK on get request success', async () => {
        await supertest(expressApp as any as App)
            .get('/api/data/games')
            .then((res) => {
                expect(StatusCodes.OK);
                expect(res).to.not.equal(undefined);
            });
        assert(dataService.getPageGames.calledOnce);
    });

    it('should send file on getGameFile', async () => {
        await supertest(expressApp as any as App)
            .get('/api/data/game/file')
            .query({ title: 'test_data', image: 1 })
            .then((response) => {
                expect(response).to.not.equal(undefined);
            });
    });

    it('should send OK on successful delete request', async () => {
        dataService.deleteGameByTitle.returns(Promise.resolve());
        await supertest(expressApp as any as App)
            .delete('/api/data/game')
            .query({ title: '1' })
            .expect(StatusCodes.OK);
        assert(dataService.deleteGameByTitle.calledOnceWith('1'));
    });

    it('should send NOT_FOUND on delete request error', async () => {
        dataService.deleteGameByTitle.returns(Promise.reject());
        await supertest(expressApp as any as App)
            .delete('/api/data/game')
            .query({ title: 'Imaginary game' })
            .expect(StatusCodes.NOT_FOUND)
            .then(() => assert(dataService.deleteGameByTitle.calledOnce));
    });

    it('should send OK if all games were deleted', async () => {
        dataService.deleteAllGames.returns(Promise.resolve({ acknowledged: true, deletedCount: Infinity }));
        await supertest(expressApp as any as App)
            .delete('/api/data/games')
            .expect(StatusCodes.OK)
            .then(() => assert(dataService.deleteAllGames.calledOnce));
    });

    it('should send NOT_FOUND if games were not deleted', async () => {
        dataService.deleteAllGames.returns(Promise.resolve({ acknowledged: false, deletedCount: 0 }));
        await supertest(expressApp as any as App)
            .delete('/api/data/games')
            .expect(StatusCodes.NOT_FOUND)
            .then(() => assert(dataService.deleteAllGames.calledOnce));
    });

    it('should send BAD_REQUEST on deleteAllGames error', async () => {
        dataService.deleteAllGames.returns(Promise.reject());
        await supertest(expressApp as any as App)
            .delete('/api/data/games')
            .expect(StatusCodes.BAD_REQUEST)
            .then(() => assert(dataService.deleteAllGames.calledOnce));
    });

    it('should send OK and call getGameHistory', async () => {
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
        dataService.getGameHistory.returns(Promise.resolve([gameHistory, gameHistory]));
        await supertest(expressApp as any as App)
            .get('/api/data/history')
            .expect(StatusCodes.OK);
        assert(dataService.getGameHistory.calledOnce);
    });

    it('should send NOT_FOUND on getGameHistory error', async () => {
        dataService.getGameHistory.returns(Promise.reject());
        await supertest(expressApp as any as App)
            .get('/api/data/history')
            .expect(StatusCodes.NOT_FOUND);
        assert(dataService.getGameHistory.calledOnce);
    });

    it('should send OK and call deleteHistory', async () => {
        dataService.deleteHistory.returns(Promise.resolve({ acknowledged: true, deletedCount: 1 }));
        await supertest(expressApp as any as App)
            .delete('/api/data/history')
            .expect(StatusCodes.OK);
        assert(dataService.deleteHistory.calledOnce);
    });

    it('should send BAD_REQUEST on deleteHistory error', async () => {
        dataService.deleteHistory.returns(Promise.reject());
        await supertest(expressApp as any as App)
            .delete('/api/data/history')
            .expect(StatusCodes.BAD_REQUEST);
        assert(dataService.deleteHistory.calledOnce);
    });
});
