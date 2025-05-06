import { expect } from 'chai';
import { fuzz, preset } from 'fuzzing';

import { Logger } from '@app/utils/logger';
import { AssetService } from './asset.service';

describe('AssetService fuzzing', () => {
    let service: AssetService;
    const logger = new Logger('./reports/fuzzing/asset_service.txt');

    beforeEach(() => {
        service = new AssetService();
    });

    it('getGameDifferences', async () => {
        const errors = await fuzz(service.getGameDifferences.bind(service)).string().errors();
        logger.log('getGameDifferences');
        logger.log(errors);
        expect(errors.length).eql(0);
    });

    it('deleteGameData', async () => {
        const errors = await fuzz(service.deleteGameData.bind(service)).string().errors();
        logger.log('deleteGameData');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });

    it('addGameData', async () => {
        const errors = await fuzz(service.addGameData.bind(service)).under(preset.string(), preset.string(), preset.string(), []).errors();
        logger.log('addGameData');
        logger.logArray(errors);
        expect(errors.length).eql(0);
    });

    it('dataExists', async () => {
        const errors = await fuzz(service.dataExists.bind(service)).string().errors();
        logger.log('dataExists');
        logger.log(errors);
        expect(errors.length).eql(0);
    });
});
