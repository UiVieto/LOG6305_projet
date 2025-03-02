/* eslint-disable max-lines */
// Max-line is disabled because this file is a test file and it is not a problem to have a long file for testing purposes
import { TestBed } from '@angular/core/testing';
import { TestLayersHelper } from '@app/classes/test-layers-helper';
import { GameFeedbackConstants, ImageConstants, TestingValues, Time } from '@app/constants/constants';
import { GameFeedbackService } from '@app/services/game-feedback.service';

describe('gameFeedback', () => {
    let service: GameFeedbackService;

    let leftLayersStub: {
        image: jasmine.SpyObj<CanvasRenderingContext2D>;
        diff: jasmine.SpyObj<CanvasRenderingContext2D>;
        clue: jasmine.SpyObj<CanvasRenderingContext2D>;
    };

    let rightLayersStub: {
        image: jasmine.SpyObj<CanvasRenderingContext2D>;
        diff: jasmine.SpyObj<CanvasRenderingContext2D>;
        clue: jasmine.SpyObj<CanvasRenderingContext2D>;
    };

    const differenceStub = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
    ];

    beforeEach(() => {
        leftLayersStub = TestLayersHelper.createLayers(true);
        rightLayersStub = TestLayersHelper.createLayers(false);

        TestBed.configureTestingModule({});
        service = TestBed.inject(GameFeedbackService);
        service.currentErrorCtx = jasmine.createSpyObj('CanvasRenderingContext2D', ['fillText', 'clearRect']);
        service['tempCtx'] = jasmine.createSpyObj('CanvasRenderingContext2D', ['drawImage']);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('initData method', () => {
        it('should set private properties', () => {
            const expectedLeftData = new Uint8ClampedArray([0, 0, 0, 0]);
            const expectedRightData = new Uint8ClampedArray([1, 1, 1, 1]);

            leftLayersStub.image.getImageData.and.returnValue(new ImageData(expectedLeftData, 1));
            rightLayersStub.image.getImageData.and.returnValue(new ImageData(expectedRightData, 1));

            service.initData(leftLayersStub, rightLayersStub);
            expect(service['leftLayers']).toEqual(leftLayersStub);
            expect(service['rightLayers']).toEqual(rightLayersStub);
            expect(leftLayersStub.image.getImageData).toHaveBeenCalled();
            expect(rightLayersStub.image.getImageData).toHaveBeenCalled();
            expect(service['leftData']).toEqual(expectedLeftData);
            expect(service['rightData']).toEqual(expectedRightData);
        });
    });

    beforeEach(() => {
        leftLayersStub.image.getImageData.and.returnValue(new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1));
        rightLayersStub.image.getImageData.and.returnValue(new ImageData(new Uint8ClampedArray([1, 1, 1, 1]), 1));
        service.initData(leftLayersStub, rightLayersStub);
    });

    describe('drawDifference method', () => {
        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(service as any, 'patchDifference');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(service as any, 'flicker');
        });

        it('should call patchDifference if player is cheating', () => {
            service.isCheating = true;
            service.drawDifference(differenceStub);
            expect(service['patchDifference']).toHaveBeenCalledWith(differenceStub, service['leftData']);
            expect(service['flicker']).not.toHaveBeenCalled();
        });

        it('should call patchDifference if player is not cheating', () => {
            service.isCheating = false;
            service.drawDifference(differenceStub);
            expect(service['flicker']).toHaveBeenCalledWith(differenceStub, GameFeedbackConstants.NbFlickers);
            expect(service['patchDifference']).not.toHaveBeenCalled();
        });
    });

    describe('drawError method', () => {
        it("should call currentErrorCtx's fillText method", () => {
            const pixelStub = { x: 0, y: 1 };
            service.drawError(pixelStub);
            expect(service.currentErrorCtx.fillText).toHaveBeenCalledWith('Erreur', pixelStub.x, pixelStub.y);
        });
    });

    describe('clearError method', () => {
        it("should call currentErrorCtx's clearRect method", () => {
            service.clearError();
            expect(service.currentErrorCtx.clearRect).toHaveBeenCalledWith(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
        });
    });

    describe('getters ', () => {
        it('should get left layer', () => {
            const left = service.left;
            expect(left).toEqual(service['leftLayers']);
        });

        it('should get right layer', () => {
            const right = service.right;
            expect(right).toEqual(service['rightLayers']);
        });
    });

    describe('setFlickerSpeed method', () => {
        it('should set flickerspeed', () => {
            const elementRefMock = {
                canvas: {
                    style: {
                        animationDuration: (0.0).toLocaleString(),
                    },
                },
            };
            service['rightLayers'].clue = elementRefMock as CanvasRenderingContext2D;
            service['leftLayers'].clue = elementRefMock as CanvasRenderingContext2D;
            service.setFlickerSpeed(Time.Delay);
            expect(service['flickerSpeed']).toEqual(TestingValues.FlickerSpeed);
            expect(service['cheatingSpeed']).toEqual(TestingValues.CheatingSpeed);
            expect(service['rightLayers'].clue.canvas.style.animationDuration).toEqual(TestingValues.FlickerSpeed.toLocaleString());
            expect(service['leftLayers'].clue.canvas.style.animationDuration).toEqual(TestingValues.FlickerSpeed.toLocaleString());
        });
    });

    describe('LimitedTime methods', () => {
        it('synchronizedNewSheet shoould call clearClue Canvas', () => {
            service.clearClueCanvas = jasmine.createSpy('clearClueCanvas');
            service['flickerCheat'] = jasmine.createSpy('flickerCheat');
            service.isCheating = true;
            service.synchronizeNewSheet();
            expect(service.clearClueCanvas).toHaveBeenCalled();
            expect(service['flickerCheat']).toHaveBeenCalled();
        });

        it('clearDifferences should call clearRect', () => {
            service.clearDifferences();
            expect(service['leftLayers'].diff.clearRect).toHaveBeenCalled();
            expect(service['rightLayers'].diff.clearRect).toHaveBeenCalled();
        });

        it('clearTimeout should call cleartimeout', () => {
            spyOn(window, 'clearTimeout');
            service.clearTimeouts();
            expect(clearTimeout).toHaveBeenCalledTimes(2);
        });

        it('useClue should call clearClueCanvas(nbClues == 1)', () => {
            const dummy = document.createElement('canvas');
            service['rightLayers'].clue = dummy.getContext('2d') as CanvasRenderingContext2D;
            service['leftLayers'].clue = dummy.getContext('2d') as CanvasRenderingContext2D;
            service.clearClueCanvas = jasmine.createSpy('clearClueCanvas');
            service['patchDifference'] = jasmine.createSpy('patch');
            service.nbClues = 1;
            const pixels = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ];
            service.useClue(pixels);
            expect(service.clearClueCanvas).toHaveBeenCalled();
            expect(service['leftLayers'].image.getImageData).toHaveBeenCalled();
            expect(service['rightLayers'].image.getImageData).toHaveBeenCalled();
            expect(service['patchDifference']).toHaveBeenCalledWith(pixels);
        });

        it('useClue should call clearClueCanvas(nbClues >1)', () => {
            const dummy = document.createElement('canvas');
            dummy.classList.add('shake');
            service['rightLayers'].clue = dummy.getContext('2d') as CanvasRenderingContext2D;
            service['leftLayers'].clue = dummy.getContext('2d') as CanvasRenderingContext2D;
            service['leftLayers'].clue.fillRect = jasmine.createSpy('fillRect');
            service['rightLayers'].clue.fillRect = jasmine.createSpy('fillRect');

            service.clearClueCanvas = jasmine.createSpy('clearClueCanvas');
            service['patchDifference'] = jasmine.createSpy('patch');
            service.nbClues = 3;
            const pixels = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ];
            service.useClue(pixels);
            expect(service['rightLayers'].clue.canvas.classList).not.toContain('shake');
            expect(service['leftLayers'].clue.canvas.classList).not.toContain('shake');
            expect(service.clearClueCanvas).toHaveBeenCalled();
            expect(service['leftLayers'].clue.fillRect).toHaveBeenCalled();
            expect(service['rightLayers'].clue.fillRect).toHaveBeenCalled();
            expect(service['patchDifference']).not.toHaveBeenCalled();
        });
    });

    describe('toggleCheat method', () => {
        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(service as any, 'flickerCheat');
        });

        it('should switch isCheating property', () => {
            service.isCheating = false;
            service.toggleCheat();
            expect(service.isCheating).toBeTruthy();
            service.toggleCheat();
            expect(service.isCheating).toBeFalsy();
        });

        it('should call flickerCheat when player is cheating', () => {
            service.isCheating = true;
            service.toggleCheat();
            expect(service['flickerCheat']).not.toHaveBeenCalled();
            service.toggleCheat();
            expect(service['flickerCheat']).toHaveBeenCalled();
        });
    });

    describe('flickerCheat method', () => {
        beforeEach(() => {
            jasmine.clock().install();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(service as any, 'flickerCheat').and.callThrough();
            service.isCheating = true;
        });

        it('should call recursively while isCheating is true', () => {
            service['flickerCheat']();

            expect(service['flickerCheat']).toHaveBeenCalledTimes(1);

            jasmine.clock().tick(GameFeedbackConstants.CheatFlickerDelay * 2);
            expect(service['flickerCheat']).toHaveBeenCalledTimes(2);
        });

        it('should stop recursive calls after isCheating is toggled to false once', () => {
            service['flickerCheat']();
            expect(service['flickerCheat']).toHaveBeenCalledTimes(1);

            service.isCheating = false;
            jasmine.clock().tick(GameFeedbackConstants.CheatFlickerDelay * 2);
            expect(service['flickerCheat']).toHaveBeenCalledTimes(1);

            service.isCheating = true;
            jasmine.clock().tick(GameFeedbackConstants.CheatFlickerDelay * 2);
            expect(service['flickerCheat']).toHaveBeenCalledTimes(1);
        });

        it('should switch canvas 4 times per second', () => {
            service['cheatingSpeed'] = GameFeedbackConstants.CheatFlickerDelay;
            service['flickerCheat']();

            jasmine.clock().tick(GameFeedbackConstants.CheatFlickerDelay - 1);
            expect(service['tempCtx'].drawImage).not.toHaveBeenCalled();
            expect(leftLayersStub.image.drawImage).not.toHaveBeenCalled();
            expect(rightLayersStub.image.drawImage).not.toHaveBeenCalled();

            jasmine.clock().tick(1);
            expect(service['tempCtx'].drawImage).toHaveBeenCalled();
            expect(leftLayersStub.image.drawImage.calls.mostRecent().args).toEqual([rightLayersStub.image.canvas, 0, 0]);
            expect(rightLayersStub.image.drawImage.calls.mostRecent().args).toEqual([service['tempCanvas'], 0, 0]);

            jasmine.clock().tick(GameFeedbackConstants.CheatFlickerDelay - 1);
            expect(leftLayersStub.image.drawImage.calls.mostRecent().args).toEqual([rightLayersStub.image.canvas, 0, 0]);
            expect(rightLayersStub.image.drawImage.calls.mostRecent().args).toEqual([service['tempCanvas'], 0, 0]);

            jasmine.clock().tick(1);
            expect(rightLayersStub.image.drawImage.calls.mostRecent().args).toEqual([leftLayersStub.image.canvas, 0, 0]);
            expect(leftLayersStub.image.drawImage.calls.mostRecent().args).toEqual([service['tempCanvas'], 0, 0]);
            expect(service['flickerCheat']).toHaveBeenCalledTimes(2);
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });
    });

    describe('flicker method', () => {
        beforeEach(() => {
            jasmine.clock().install();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(service as any, 'flicker').and.callThrough();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(service as any, 'patchDifference');
        });

        it('should call recursively for the initial count amount of times', () => {
            service['flicker'](differenceStub, GameFeedbackConstants.NbFlickers);
            jasmine.clock().tick(GameFeedbackConstants.FlickerDelay * 2 * GameFeedbackConstants.NbFlickers);
            expect(service['flicker']).toHaveBeenCalledTimes(GameFeedbackConstants.NbFlickers);
        });

        it('should swap differences layers with even delays', () => {
            service['flicker'](differenceStub, 1);

            jasmine.clock().tick(GameFeedbackConstants.FlickerDelay - 1);
            expect(service['patchDifference']).not.toHaveBeenCalled();

            jasmine.clock().tick(1);
            expect(service['patchDifference']).toHaveBeenCalledWith(differenceStub, service['rightData']);

            jasmine.clock().tick(GameFeedbackConstants.FlickerDelay - 1);
            expect(service['patchDifference']).toHaveBeenCalledTimes(1);

            jasmine.clock().tick(1);
            expect(service['patchDifference']).toHaveBeenCalledWith(differenceStub, service['leftData']);
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });
    });

    describe('patchDifference method', () => {
        it('should call drawOnCanvas with correct layer, fillStyle and pixel', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const drawOnCanvas = spyOn(service as any, 'drawOnCanvas');

            const differenceStub2 = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            ];
            const dataStub = new Uint8ClampedArray([0, 0, 1, 1, 2, 2, 3, 3]);

            service['patchDifference'](differenceStub2, dataStub);

            expect(drawOnCanvas.calls.allArgs()).toEqual([
                [rightLayersStub.diff, `rgb(${dataStub[0]}, ${dataStub[1]}, ${dataStub[2]})`, differenceStub2[0]],
                [leftLayersStub.diff, `rgb(${dataStub[0]}, ${dataStub[1]}, ${dataStub[2]})`, differenceStub2[0]],
                [rightLayersStub.diff, `rgb(${dataStub[4]}, ${dataStub[5]}, ${dataStub[6]})`, differenceStub2[1]],
                [leftLayersStub.diff, `rgb(${dataStub[4]}, ${dataStub[5]}, ${dataStub[6]})`, differenceStub2[1]],
            ]);
        });

        it('should call drawOnCanvas with correct layer, fillStyle and pixel', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const drawOnCanvas = spyOn(service as any, 'drawOnCanvas');

            const differenceStub2 = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            ];

            service['patchDifference'](differenceStub2, undefined);

            expect(drawOnCanvas.calls.allArgs()).toEqual([
                [rightLayersStub.clue, `rgb(${service['rightData'][0]}, ${service['rightData'][1]}, ${service['rightData'][2]})`, differenceStub2[0]],
                [leftLayersStub.clue, `rgb(${service['leftData'][0]}, ${service['leftData'][1]}, ${service['leftData'][2]})`, differenceStub2[0]],
                [rightLayersStub.clue, `rgb(${service['rightData'][4]}, ${service['rightData'][5]}, ${service['rightData'][6]})`, differenceStub2[1]],
                [leftLayersStub.clue, `rgb(${service['leftData'][4]}, ${service['leftData'][5]}, ${service['leftData'][6]})`, differenceStub2[1]],
            ]);
        });
    });

    describe('drawOnCanvas method', () => {
        it('should call fillRect with correct values', () => {
            const expectedStyle = 'rgb(1, 2, 3)';
            const expectedPixel = { x: 0, y: 1 };
            service['drawOnCanvas'](service['leftLayers'].diff, expectedStyle, expectedPixel);
            expect(service['leftLayers'].diff.fillStyle).toEqual(expectedStyle);
            expect(service['leftLayers'].diff.fillRect).toHaveBeenCalledWith(expectedPixel.x, expectedPixel.y, 1, 1);
        });
    });
});
