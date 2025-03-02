import { AssetService } from '@app/services/asset.service';
import { expect } from 'chai';
import { Pixel } from 'common/pixel';
import { assert } from 'console';
import * as fs from 'fs';
import Jimp, * as jimp from 'jimp';
import { SinonMock, SinonStubbedInstance, mock, stub } from 'sinon';

describe('AssetService', () => {
    let service: AssetService;
    let fsMock: SinonMock;
    let jimpMock: SinonMock;

    beforeEach(() => {
        service = new AssetService();
        fsMock = mock(fs);
        jimpMock = mock(jimp);
    });

    afterEach(() => {
        fsMock.restore();
        jimpMock.restore();
    });

    it('getGameDifferences should call fs.readFile and return the given data', async () => {
        const coords: Pixel[][] = [[{ x: 0, y: 1 }], [{ x: 1, y: 1 }]];
        fsMock
            .expects('readFile')
            .once()
            .callsFake((path: string, encoding: string, callback: (error: null, data: string) => Promise<Pixel[][]>) => {
                callback(null, JSON.stringify(coords));
            });
        expect(await service.getGameDifferences('game')).eql(coords);
        fsMock.verify();
    });

    it('getGameDifferences should return undefined on fs.readFile error', async () => {
        const coords: Pixel[][] = [[{ x: 0, y: 1 }], [{ x: 1, y: 1 }]];
        const error: Error = new Error('Test');
        fsMock
            .expects('readFile')
            .once()
            .callsFake((path: string, encoding: string, callback: (error: Error, data: Pixel[][]) => Promise<Pixel[][]>) => {
                callback(error, coords);
            });
        expect(await service.getGameDifferences('game')).eql(undefined);
        fsMock.verify();
    });

    it('deleteGameData should call fs.rm', async () => {
        const removeStub = stub(fs.promises, 'rm');
        await service.deleteGameData('game');
        assert(removeStub.calledOnceWith(service['dataPath'] + 'game', { recursive: true }));
        removeStub.restore();
    });

    it('addGameData should call the correct methods and functions', async () => {
        const path = service['dataPath'] + 'test/';
        const mkdirStub = stub(fs.promises, 'mkdir');
        const writeFileStub = stub(fs.promises, 'writeFile');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- The test only looks if the method does the correct calls.
        const writeImageStub = stub(service as any, 'writeImage');
        await service.addGameData('test', { image1: 'image1', image2: 'image2' }, [[{ x: 0, y: 0 }]]);
        assert(mkdirStub.calledOnceWith(path, { recursive: true }));
        assert(writeFileStub.calledOnceWith(path + 'diffs.json', JSON.stringify([[{ x: 0, y: 0 }]])));
        expect(writeImageStub.getCall(0).args).eql(['image1', path + '1.bmp']);
        expect(writeImageStub.getCall(1).args).eql(['image2', path + '2.bmp']);
        mkdirStub.restore();
        writeFileStub.restore();
        writeImageStub.restore();
    });

    it('dataExists should return true for existing title in data', async () => {
        fsMock
            .expects('readdir')
            .once()
            .callsFake((path: string, callback: (error: null, files: string[]) => boolean) => {
                callback(null, ['title']);
            });

        expect(await service.dataExists('title')).to.eql(true);
        fsMock.verify();
    });

    it('dataExists should return false if title is not in data', async () => {
        fsMock
            .expects('readdir')
            .once()
            .callsFake((path: string, callback: (error: null, files: string[]) => boolean) => {
                callback(null, ['GHOST']);
            });

        expect(await service.dataExists('title')).to.eql(false);
        fsMock.verify();
    });

    it('dataExists should reject on error', async () => {
        const error = new Error('Test');
        fsMock
            .expects('readdir')
            .once()
            .callsFake((path: string, callback: (err: Error, files: string[]) => boolean) => {
                callback(error, ['title']);
            });

        service.dataExists('title').catch((err: Error) => {
            expect(err).equal(error);
        });
        fsMock.verify();
    });

    it('writeImage should write an image at the specified path', async () => {
        const jimpImageStub = stub({
            write: (path: string) => {
                return new Jimp(path);
            },
        });
        jimpMock
            .expects('read')
            .once()
            .callsFake((data: Buffer, callback: (err: null, img: SinonStubbedInstance<typeof jimpImageStub>) => Jimp) => {
                callback(null, jimpImageStub);
            });
        await service['writeImage']('', '');
        expect(jimpImageStub.write.calledOnceWith('Test'));
        jimpMock.verify();
    });

    it('writeImage should reject with an error on read error', async () => {
        const error = new Error('Test');
        jimpMock
            .expects('read')
            .once()
            .callsFake((data: Buffer, callback: (err: Error, img: undefined) => Jimp) => {
                callback(error, undefined);
            });
        await service['writeImage']('', '').catch((err: Error) => {
            expect(err).equal(error);
        });
        jimpMock.verify();
    });
});
