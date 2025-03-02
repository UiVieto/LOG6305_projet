/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { Eraser } from './eraser';
import { Tool } from './tool';

describe('Pencil', () => {
    let eraser: Eraser;
    let topCanvas: jasmine.SpyObj<HTMLCanvasElement>;
    let middleContext: jasmine.SpyObj<CanvasRenderingContext2D>;
    const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 2,
        clientY: 2,
    });

    beforeEach(() => {
        topCanvas = jasmine.createSpyObj('HTMLCanvasElement', ['getBoundingClientRect'], {
            width: 3,
            height: 3,
        });
        topCanvas.getBoundingClientRect.and.returnValue(new DOMRect(1, 2));
        middleContext = jasmine.createSpyObj('CanvasRenderingContext2D', ['beginPath', 'moveTo', 'lineTo', 'stroke', 'clearRect'], {
            canvas: topCanvas,
        });

        Tool.currentMiddleCtx = middleContext;

        TestBed.configureTestingModule({
            providers: [Eraser],
        });

        eraser = TestBed.inject(Eraser);
    });

    it('should be created', () => {
        expect(eraser).toBeTruthy();
    });

    it('toString should return "eraser', () => {
        expect(eraser.toString()).toEqual('eraser');
    });

    it('start should set relevant properties and call clearRect', () => {
        const expectedCompositeOp = 'destination-out';
        const expectedEraserWidth = 2;
        Tool.eraserWidth = expectedEraserWidth;

        eraser.start(mouseDownEvent);

        expect(middleContext.globalCompositeOperation).toEqual(expectedCompositeOp);
        expect(middleContext.lineWidth).toEqual(expectedEraserWidth);
        expect(eraser['initialX']).toEqual(1);
        expect(eraser['initialY']).toEqual(0);
        expect(middleContext.clearRect).toHaveBeenCalledWith(0, -1, 2, 2);
    });

    it('move should call eraseFixedAxis according to the mouse moving horizontally', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(eraser, 'eraseFixedAxis');
        eraser['initialX'] = 20;
        eraser['initialY'] = 30;

        eraser.move(
            new MouseEvent('mouseMove', {
                clientX: 21,
                clientY: 12,
            }),
        );
        expect(eraser['eraseFixedAxis']).toHaveBeenCalledWith([0, -2, -0, -4], 20);
    });

    it('should call eraseFixedAxis according to the mouse moving vertically', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(eraser, 'eraseFixedAxis');
        eraser['initialX'] = 0;
        eraser['initialY'] = 0;

        eraser.move(
            new MouseEvent('mouseMove', {
                clientX: 26,
                clientY: 2,
            }),
        );
        expect(eraser['eraseFixedAxis']).toHaveBeenCalledWith([2, 0, 4, -0], 25);
    });

    it('should call eraseFixedAxis and get negative sign', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(eraser, 'eraseFixedAxis');
        eraser['initialX'] = 48;
        eraser['initialY'] = 30;

        eraser.move(
            new MouseEvent('mouseMove', {
                clientX: 54,
                clientY: 42,
            }),
        );
        expect(eraser['eraseFixedAxis']).toHaveBeenCalledWith([0, 2, 2, 4], 10);
    });

    it('eraseFixedAxis should determine erase path according to given step values and direction', () => {
        eraser['initialX'] = 20;
        eraser['initialY'] = 30;
        eraser['eraseFixedAxis']([1, 2, 3, 4], 5);
        expect(middleContext.beginPath).toHaveBeenCalledTimes(2);
        expect(middleContext.stroke).toHaveBeenCalledTimes(2);
        expect(eraser['initialX']).toEqual(26);
        expect(eraser['initialY']).toEqual(38);
        expect(middleContext.moveTo.calls.argsFor(0)).toEqual([20, 30]);
        expect(middleContext.moveTo.calls.argsFor(1)).toEqual([23, 34]);
        expect(middleContext.lineTo.calls.argsFor(0)).toEqual([21, 32]);
        expect(middleContext.lineTo.calls.argsFor(1)).toEqual([24, 36]);
    });

    it('stop should set currentMiddleCtx.globalCompositeOperation to "source-over"', () => {
        eraser.stop();
        expect(Tool.currentMiddleCtx.globalCompositeOperation).toEqual('source-over');
    });

    it('enter should call currentTopCtx.beginPath', () => {
        eraser.enter();
        expect(middleContext.beginPath).toHaveBeenCalled();
    });
});
