import { expect } from 'chai';

import { fuzz, preset } from 'fuzzing';

import { DataService } from '@app/services/data.service';
import { Logger } from '@app/utils/logger';
import { Game } from '@common/game';
import { GameArchive } from '@common/game-archive';
import { GameType } from '@common/game-instance';

describe('DataService fuzzing', () => {
    const logger = new Logger('./reports/fuzzing/data_service.txt');

    const generateGame: (title: string, image: string, playerName: string) => Game = (title: string, image: string, playerName: string) => {
        return {
            title,
            image1: image,
            image2: image,
            differences: [],
            bestTimes: {
                solo: [{ playerName, time: 100 }],
                versus: [{ playerName, time: 100 }],
            },
            isHard: false,
        };
    };

    const generateGameArchive: (title: string, playerName: string) => GameArchive = (title: string, playerName: string) => {
        return {
            gameTitle: title,
            startDate: 100,
            playingTime: 30,
            endClock: 50,
            gameMode: GameType.Classic,
            p1Name: playerName,
            p2Name: playerName,
            isPlayer1: true,
            hasAbandoned: false,
        };
    };

    let service: DataService;

    beforeEach(async () => {
        service = await DataService.getInstance();
    });

    it('titleExists', async () => {
        const errors = await fuzz(service.titleExists.bind(service)).string().errors();

        logger.log('titleExists');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });

    it('getGame', async () => {
        const errors = await fuzz(service.getGame.bind(service)).string().errors();

        logger.log('getGame');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });

    it('getBestTimesByGame', async () => {
        const errors = await fuzz(service.getBestTimesByGame.bind(service)).string().errors();

        logger.log('getBestTimesByGame');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });

    it('getPageGames', async () => {
        const errors = await fuzz(service.getPageGames.bind(service)).number().errors();

        logger.log('getPageGames');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });

    it('resetGameBestTime', async () => {
        const errors = await fuzz(service.resetGameBestTime.bind(service)).string().errors();

        logger.log('resetGameBestTime');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });

    it('deleteGameByTitle', async () => {
        const errors = await fuzz(service.deleteGameByTitle.bind(service)).string().errors();

        logger.log('deleteGameByTitle');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });

    it('createGame', async () => {
        const createGame = async (title: string, image: string, playerName: string) => {
            await service.createGame(generateGame(title, image, playerName));
        };

        const errors = await fuzz(createGame).under(preset.string(), preset.string(), preset.string()).errors();
        logger.log('createGame');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });

    it('addGameHistory', async () => {
        const addGameHistory = async (title: string, playerName: string) => {
            return await service.addGameHistory(generateGameArchive(title, playerName));
        };

        const errors = await fuzz(addGameHistory).under(preset.string(), ['Test']).errors();
        logger.log('addGameHistory');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });
});
