import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { TestFilesHelper } from '@app/classes/test-files-helper';
import { ImageConstants } from '@app/constants/constants';
import { of } from 'rxjs';
import { CompareService } from './compare.service';
import { Game } from '@common/game';

describe('CompareService', () => {
    let compareService: CompareService;

    let baseCanvasStub1: HTMLCanvasElement;
    let baseCanvasStub2: HTMLCanvasElement;
    let overCanvasStub1: HTMLCanvasElement;
    let overCanvasStub2: HTMLCanvasElement;
    let differencesCanvasStub: HTMLCanvasElement;

    let baseContextStub1: CanvasRenderingContext2D;
    let baseContextStub2: CanvasRenderingContext2D;
    let overContextStub1: CanvasRenderingContext2D;
    let overContextStub2: CanvasRenderingContext2D;
    let differencesContextStub: CanvasRenderingContext2D;

    const INVALID_FILES = [
        { name: 'image_wrong_format.jpeg', error: 'Le fichier doit être dans un format BMP' },
        { name: 'image_wrong_bit_depth.bmp', error: 'Le fichier BMP doit être 24-bit' },
        { name: 'image_wrong_res.bmp', error: "L'image doit être de résolution 640 x 480 pixels" },
    ];
    const VALID_FILES = ['image_7_diff.bmp', 'image_empty.bmp', 'image_corner_pixel.bmp', 'image_7_diff_corner_touching.bmp'];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        compareService = TestBed.inject(CompareService);

        baseCanvasStub1 = CanvasTestHelper.createCanvas(ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
        baseCanvasStub2 = CanvasTestHelper.createCanvas(ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
        overCanvasStub1 = CanvasTestHelper.createCanvas(ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
        overCanvasStub2 = CanvasTestHelper.createCanvas(ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
        differencesCanvasStub = CanvasTestHelper.createCanvas(ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);

        baseContextStub1 = baseCanvasStub1.getContext('2d') as CanvasRenderingContext2D;
        baseContextStub2 = baseCanvasStub2.getContext('2d') as CanvasRenderingContext2D;
        overContextStub1 = overCanvasStub1.getContext('2d') as CanvasRenderingContext2D;
        overContextStub2 = overCanvasStub2.getContext('2d') as CanvasRenderingContext2D;
        differencesContextStub = differencesCanvasStub.getContext('2d') as CanvasRenderingContext2D;

        compareService['differencesContext'] = differencesContextStub;

        compareService.initContexts(baseContextStub1, overContextStub1, baseContextStub2, overContextStub2);
    });

    it('should be created', () => {
        expect(compareService).toBeTruthy();
    });

    describe('drawImage method', () => {
        INVALID_FILES.forEach((file) => {
            it(`should not display and return '${file.error}' with '${file.name}'`, async () => {
                const drawSpy = spyOn(baseContextStub1, 'drawImage');
                const fileStub = await TestFilesHelper.createFile(file.name);
                expect(await compareService.drawImage(fileStub, baseContextStub1)).toEqual(file.error);
                expect(drawSpy).not.toHaveBeenCalled();
            });
        });
        it(`should display ${VALID_FILES[0]} with given context only and return ''`, async () => {
            const originalCtxSpy = spyOn(baseContextStub1, 'drawImage');
            const modifiedCtxSpy = spyOn(compareService['baseContext2'], 'drawImage');
            const fileStub = await TestFilesHelper.createFile(VALID_FILES[0]);
            expect(await compareService.drawImage(fileStub, baseContextStub1)).toEqual('');
            expect(originalCtxSpy).toHaveBeenCalled();
            expect(modifiedCtxSpy).not.toHaveBeenCalled();
        });
        it(`should display ${VALID_FILES[0]} on both contexts if none are given`, async () => {
            const originalCtxSpy = spyOn(compareService['baseContext1'], 'drawImage');
            const modifiedCtxSpy = spyOn(compareService['baseContext2'], 'drawImage');
            const fileStub = await TestFilesHelper.createFile(VALID_FILES[0]);
            await compareService.drawImage(fileStub);
            expect(originalCtxSpy).toHaveBeenCalled();
            expect(modifiedCtxSpy).toHaveBeenCalled();
        });
    });

    describe('clearImage method', () => {
        it('should clear canvas', () => {
            const originalCtxSpy = spyOn(compareService['baseContext1'], 'clearRect');
            compareService.clearImage(baseContextStub1);
            expect(originalCtxSpy).toHaveBeenCalled();
        });
    });

    describe('drawDifferences method', () => {
        it("should draw different pixel within canvas' bounds", async () => {
            const emptyStub = await TestFilesHelper.createFile(VALID_FILES[1]);
            const cornerPixelStub = await TestFilesHelper.createFile(VALID_FILES[2]);
            await compareService.drawImage(emptyStub, baseContextStub1);
            await compareService.drawImage(cornerPixelStub, baseContextStub2);

            const fillRectSpy = spyOn(compareService['differencesContext'], 'fillRect');
            const enlargement = 15;

            compareService.mergeCanvases();
            compareService.drawDifferences(enlargement);
            expect(fillRectSpy).toHaveBeenCalledTimes(2);
            expect(fillRectSpy).toHaveBeenCalledWith(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
            expect(fillRectSpy).toHaveBeenCalledWith(0, 0, enlargement + 1, enlargement + 1);
        });
    });

    describe('validateDifferences method', () => {
        it('should call floodFill once per difference', async () => {
            const emptyStub = await TestFilesHelper.createFile(VALID_FILES[0]);
            const cornerPixelStub = await TestFilesHelper.createFile(VALID_FILES[1]);
            await compareService.drawImage(emptyStub, baseContextStub1);
            await compareService.drawImage(cornerPixelStub, baseContextStub2);

            compareService.mergeCanvases();
            compareService.drawDifferences(0);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const floodFillSpy = spyOn<any>(compareService, 'floodFill').and.callThrough();
            compareService.validateDifferences();
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(floodFillSpy).toHaveBeenCalledTimes(7);
        });
    });

    describe('floodFill method', () => {
        it('should consider corner-touching pixels as part of one difference', async () => {
            const emptyStub = await TestFilesHelper.createFile(VALID_FILES[0]);
            const cornerPixelStub = await TestFilesHelper.createFile(VALID_FILES[3]);
            await compareService.drawImage(emptyStub, baseContextStub1);
            await compareService.drawImage(cornerPixelStub, baseContextStub2);

            compareService.mergeCanvases();
            compareService.drawDifferences(0);

            compareService.validateDifferences();
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(compareService['differencesCoords'].length).toEqual(8);
        });
    });

    describe('getDifficulty method', () => {
        it("should return 'facile' for 6 or less differences", () => {
            compareService['differencesCoords'] = Array.from({ length: 6 }, () => Array.from({ length: 10 }));
            expect(compareService['getDifficulty']()).toEqual('facile');
        });
        it("should return 'facile' for more then 15% different pixels", () => {
            compareService['differencesCoords'] = Array.from({ length: 7 }, () => Array.from({ length: 6583 }));
            expect(compareService['getDifficulty']()).toEqual('facile');
        });
        it("should return 'difficile' for more than 6 differences and less than 15% different pixels", () => {
            compareService['differencesCoords'] = Array.from({ length: 7 }, () => Array.from({ length: 6582 }));
            expect(compareService['getDifficulty']()).toEqual('difficile');
        });
        it("should return 'invalide' for differences not between 3 and 9", () => {
            compareService['differencesCoords'] = Array.from({ length: 2 }, () => Array.from({ length: 1 }));
            expect(compareService['getDifficulty']()).toEqual('invalide');
            compareService['differencesCoords'] = Array.from({ length: 10 }, () => Array.from({ length: 1 }));
            expect(compareService['getDifficulty']()).toEqual('invalide');
        });
    });

    describe('isComparable getter', () => {
        it('should return true when both canvas display', async () => {
            const emptyStub = await TestFilesHelper.createFile(VALID_FILES[0]);
            const img = new Image();
            img.src = window.URL.createObjectURL(emptyStub);
            await new Promise<HTMLImageElement>((resolve) => {
                img.onload = () => resolve(img);
            });

            expect(compareService.isComparable).toBeFalsy();

            baseContextStub1.drawImage(img, 0, 0);
            expect(compareService.isComparable).toBeFalsy();

            baseContextStub2.drawImage(img, 0, 0);
            expect(compareService.isComparable).toBeTruthy();

            compareService.clearImage(baseContextStub1);
            expect(compareService.isComparable).toBeFalsy();
        });
    });

    describe('createGame method', () => {
        it('should not create if title exists', async () => {
            spyOn(compareService.communicationService, 'titleExistsGet').and.returnValue(of(true));
            const createGameSpy = spyOn(compareService.communicationService, 'createGamePost');
            compareService.createGame('title', 'facile');
            expect(createGameSpy).not.toHaveBeenCalled();
        });

        it('should create if title does not exist', async () => {
            const gameStub = {
                title: '1',
                image1: jasmine.any(String) as unknown as string,
                image2: jasmine.any(String) as unknown as string,
                differences: [],
                bestTimes: {
                    solo: [],
                    versus: [],
                },
                isHard: false,
            } as Game;
            spyOn(compareService['baseContext1'].canvas, 'toDataURL').and.returnValue('image1');
            spyOn(compareService['baseContext2'].canvas, 'toDataURL').and.returnValue('image2');
            compareService['differencesCoords'] = [];

            spyOn(compareService.communicationService, 'titleExistsGet').and.returnValue(of(false));
            const createGameSpy = spyOn(compareService.communicationService, 'createGamePost').and.returnValue(of(true));
            compareService.createGame('1', 'facile');
            expect(createGameSpy).toHaveBeenCalledWith(gameStub);
        });
    });
});
