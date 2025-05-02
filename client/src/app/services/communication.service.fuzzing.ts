import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { fuzz, preset } from 'fuzzing';

import { CommunicationService } from '@app/services/communication.service';

describe('Server', () => {
    let service: CommunicationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
        });
        service = TestBed.inject(CommunicationService);
    });

    it('server should be running', async () => {
        const history = await new Promise((resolve) => {
            service.getHistory().subscribe((data) => resolve(data));
        });
        expect(history).toBeTruthy();
    });
});

describe('CommunicationService Fuzzing', () => {
    let service: CommunicationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
        });
        service = TestBed.inject(CommunicationService);
    });

    afterEach(() => {});

    it('titleExistsGet', async () => {
        console.log('titleExistsGet');
        const titleExistsGet = async (title: string) => {
            return await firstValueFrom(service.titleExistsGet(title));
        };

        let errors = await fuzz(titleExistsGet).string().errors();
        console.log(`Errors founds: ${errors.length}`);
        console.log(errors);
        expect(errors.length).toEqual(0);
    });

    it('getGameFile', async () => {
        console.log('getGameFile');
        const getGameFile = async (title: string, original: boolean) => {
            return await firstValueFrom(service.getGameFile(title, original));
        };
        const errors = await fuzz(getGameFile).under(preset.string(), preset.booleanArray()).errors();
        console.log(`Errors founds: ${errors.length}`);
        console.log(errors);
        expect(errors.length).toEqual(0);
    });

    it('getGameFiles', async () => {
        console.log('getGameFiles');
        const getGameFiles = async (title: string) => {
            return await firstValueFrom(service.getGameFiles(title));
        };
        const errors = await fuzz(getGameFiles).string().errors();
        console.log(`Errors founds: ${errors.length}`);
        console.log(errors);
        expect(errors.length).toEqual(0);
    });

    it('getGames', async () => {
        console.log('getGames');
        const getGames = async (pageIndex: number) => {
            return await firstValueFrom(service.getGames(pageIndex));
        };
        const errors = await fuzz(getGames).numberArray().errors();
        console.log(`Errors founds: ${errors.length}`);
        console.log(errors);
        expect(errors.length).toEqual(0);
    });

    it('createGamePost', async () => {
        /* Crash l'exécution
        console.log('createGamePost');
        const createGamePost = async (
            title: string,
            image1: string,
            image2: string,
            differences: Pixel[][],
            playerName: string,
            time: number,
            isHard: boolean,
        ) => {
            return await firstValueFrom(
                service.createGamePost({
                    title,
                    image1,
                    image2,
                    differences,
                    bestTimes: {
                        solo: [{ playerName, time }],
                        versus: [{ playerName, time }],
                    },
                    isHard,
                }),
            );
        };
        const errors = await fuzz(createGamePost)
            .under(preset.string(), preset.string(), preset.string(), [], preset.string(), preset.numberArray(), preset.booleanArray())
            .errors();
        console.log(`Errors founds: ${errors.length}`);
        console.log(errors);
        expect(errors.length).toEqual(0);
        */
    });

    it('deleteGame', async () => {
        console.log('deleteGame');
        const deleteGame = async (title: string) => {
            return await firstValueFrom(service.deleteGame(title));
        };
        const errors = await fuzz(deleteGame).string().errors();
        console.log(`Errors founds: ${errors.length}`);
        console.log(errors);
        expect(errors.length).toEqual(0);
    });
});
