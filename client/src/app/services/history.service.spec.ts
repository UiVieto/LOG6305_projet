import { TestBed } from '@angular/core/testing';

import { HistoryService } from './history.service';
const CANVAS_SIZE = 100;
const IMAGE_DATA = 50;
const TIMEOUT_INTERVAL = 100;
describe('HistoryService', () => {
    let service: HistoryService;

    let canvasSpy1: jasmine.SpyObj<HTMLCanvasElement>;
    let canvasSpy2: jasmine.SpyObj<HTMLCanvasElement>;

    let contextStub1: jasmine.SpyObj<CanvasRenderingContext2D>;
    let contextStub2: jasmine.SpyObj<CanvasRenderingContext2D>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(HistoryService);

        canvasSpy1 = jasmine.createSpyObj('HTMLCanvasElement', ['getContext', 'querySelector', 'toDataURL']);
        canvasSpy2 = jasmine.createSpyObj('HTMLCanvasElement', ['getContext', 'querySelector', 'toDataURL']);

        contextStub1 = jasmine.createSpyObj('CanvasRenderingContext2D', ['clearRect', 'drawImage'], {
            canvas: canvasSpy1,
        });
        contextStub2 = jasmine.createSpyObj('CanvasRenderingContext2D', ['clearRect', 'drawImage'], {
            canvas: canvasSpy2,
        });

        canvasSpy1.getContext.and.returnValue(contextStub1);
        canvasSpy2.getContext.and.returnValue(contextStub2);

        canvasSpy1.querySelector.and.returnValue(canvasSpy1);
        canvasSpy2.querySelector.and.returnValue(canvasSpy2);

        service['context1'] = contextStub1;
        service['context2'] = contextStub2;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add an event listener to the window', () => {
        const spy = spyOn(window, 'addEventListener');
        service = new HistoryService();
        expect(spy).toHaveBeenCalledWith('keydown', jasmine.any(Function));
    });

    it('ctrl + z should call undoAction', () => {
        const spy = spyOn(service, 'undoAction');
        const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'z' });
        window.dispatchEvent(event);
        expect(spy).toHaveBeenCalled();
    });

    it('ctrl + shift + z should call redoAction', () => {
        const spy = spyOn(service, 'redoAction');
        const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'Z' });
        window.dispatchEvent(event);
        expect(spy).toHaveBeenCalled();
    });

    it('should initialize the contexts', () => {
        expect(service['context1']).toBeDefined();
        expect(service['context2']).toBeDefined();
    });

    it('should save the state', () => {
        service.saveState(service.undoArr, true);
        expect(service.undoArr.length).toBe(1);
        expect(service.redoArr.length).toBe(0);
    });

    it('should save the state on redo action', () => {
        service.saveState(service.redoArr, false);
        expect(service.redoArr.length).toBe(1);
        expect(service.undoArr.length).toBe(0);
    });

    it('should restore the state', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = spyOn<any>(service, 'drawCanvas');
        service.saveState(service.undoArr, true);
        service['restoreState'](service.undoArr, service.redoArr);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(service.undoArr.length).toBe(0);
        expect(service.redoArr.length).toBe(1);
    });

    it('image.onload test', (done) => {
        const canvasFrom = document.createElement('canvas');
        canvasFrom.width = CANVAS_SIZE;
        canvasFrom.height = CANVAS_SIZE;
        const ctxFrom = canvasFrom.getContext('2d');
        if (ctxFrom) {
            ctxFrom.fillStyle = 'red';
            ctxFrom.fillRect(0, 0, IMAGE_DATA, IMAGE_DATA);
        }

        const canvasTo = document.createElement('canvas');
        canvasTo.width = CANVAS_SIZE;
        canvasTo.height = CANVAS_SIZE;
        service['drawCanvas'](canvasTo.getContext('2d') as CanvasRenderingContext2D, canvasFrom.toDataURL());
        setTimeout(() => {
            if (ctxFrom) {
                const expectedImageData = ctxFrom.getImageData(0, 0, IMAGE_DATA, IMAGE_DATA);
                const canvasContext = canvasTo.getContext('2d');
                if (canvasContext) {
                    const actualImageData = canvasContext.getImageData(0, 0, IMAGE_DATA, IMAGE_DATA);
                    expect(actualImageData).toEqual(expectedImageData);
                }
            }
            done();
        }, TIMEOUT_INTERVAL);
    });

    it('should call restoreState on redoAction', () => {
        service['restoreState'] = jasmine.createSpy('restoreState');
        service.redoAction();
        expect(service['restoreState']).toHaveBeenCalledWith(service['redoArr'], service['undoArr']);
    });

    it('should call restoreState on undoAction', () => {
        service['restoreState'] = jasmine.createSpy('restoreState');
        service.undoAction();
        expect(service['restoreState']).toHaveBeenCalledWith(service['undoArr'], service['redoArr']);
    });
});
