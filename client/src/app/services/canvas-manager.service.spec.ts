import { TestBed } from '@angular/core/testing';

import { CanvasManagerService } from './canvas-manager.service';
const CANVAS_SIZE = 100;
const IMAGE_DATA = 50;
const TIMEOUT_INTERVAL = 100;
describe('CanvasManagerService', () => {
    let service: CanvasManagerService;

    let canvasSpy1: jasmine.SpyObj<HTMLCanvasElement>;
    let canvasSpy2: jasmine.SpyObj<HTMLCanvasElement>;

    let contextStub1: jasmine.SpyObj<CanvasRenderingContext2D>;
    let contextStub2: jasmine.SpyObj<CanvasRenderingContext2D>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CanvasManagerService);

        canvasSpy1 = jasmine.createSpyObj('HTMLCanvasElement', ['getContext', 'querySelector', 'toDataURL']);
        canvasSpy2 = jasmine.createSpyObj('HTMLCanvasElement', ['getContext', 'querySelector', 'toDataURL']);

        contextStub1 = jasmine.createSpyObj('CanvasRenderingContext2D', ['clearRect'], {
            canvas: canvasSpy1,
        });

        contextStub2 = jasmine.createSpyObj('CanvasRenderingContext2D', ['clearRect'], {
            canvas: canvasSpy2,
        });

        canvasSpy1.getContext.and.returnValue(contextStub1);
        canvasSpy2.getContext.and.returnValue(contextStub2);

        canvasSpy1.querySelector.and.returnValue(canvasSpy1);
        canvasSpy2.querySelector.and.returnValue(canvasSpy2);

        service.initContexts(canvasSpy1, canvasSpy2);

        service['historyService'].initContexts(canvasSpy1, canvasSpy2);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize the contexts', () => {
        expect(service['context1']).toBeTruthy();
        expect(service['context2']).toBeTruthy();
    });

    it('should save the state of the canvases in the history before resetting', () => {
        const spy = spyOn(service['historyService'], 'saveState');
        service.resetOverlay(canvasSpy1);
        expect(spy).toHaveBeenCalled();
    });

    it('should save the state of the canvases in the history before swapping', () => {
        const spy = spyOn(service['historyService'], 'saveState');
        service.swapOverlays();
        expect(spy).toHaveBeenCalled();
    });

    it('should save the state of the canvases in the history before duplicating', () => {
        const spy = spyOn(service['historyService'], 'saveState');
        service.duplicate('toLeft');
        expect(spy).toHaveBeenCalled();
    });

    it('should clear only the canvas that is being reset', () => {
        service.resetOverlay(canvasSpy1);
        expect(contextStub1.clearRect).toHaveBeenCalled();
        expect(contextStub2.clearRect).not.toHaveBeenCalled();
    });

    it('should swap the canvases', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = spyOn<any>(service, 'drawCanvas');
        service.swapOverlays();
        expect(spy).toHaveBeenCalledWith(canvasSpy2, canvasSpy1);
        expect(spy).toHaveBeenCalledWith(canvasSpy1, canvasSpy2);
    });

    it('should duplicate the right canvas to the left', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = spyOn<any>(service, 'drawCanvas');
        service.duplicate('toLeft');
        expect(spy).toHaveBeenCalledWith(canvasSpy1, canvasSpy2);
    });

    it('should duplicate the left canvas to the right', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = spyOn<any>(service, 'drawCanvas');
        service.duplicate('toRight');
        expect(spy).toHaveBeenCalledWith(canvasSpy2, canvasSpy1);
    });

    it('image.onload test', (done) => {
        const canvasFrom = document.createElement('canvas');
        canvasFrom.width = CANVAS_SIZE;
        canvasFrom.height = CANVAS_SIZE;
        const contexFrom = canvasFrom.getContext('2d');
        if (contexFrom) {
            contexFrom.fillStyle = 'red';
            contexFrom.fillRect(0, 0, IMAGE_DATA, IMAGE_DATA);
        }

        const canvasTo = document.createElement('canvas');
        canvasTo.width = CANVAS_SIZE;
        canvasTo.height = CANVAS_SIZE;
        service['drawCanvas'](canvasTo, canvasFrom);
        setTimeout(() => {
            if (contexFrom) {
                const expectedImageData = contexFrom.getImageData(0, 0, IMAGE_DATA, IMAGE_DATA);
                const canvasContext = canvasTo.getContext('2d');
                if (canvasContext) {
                    const actualImageData = canvasContext.getImageData(0, 0, IMAGE_DATA, IMAGE_DATA);
                    expect(actualImageData).toEqual(expectedImageData);
                }
            }
            done();
        }, TIMEOUT_INTERVAL);
    });
});
