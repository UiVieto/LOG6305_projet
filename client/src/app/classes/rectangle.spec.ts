/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { Rectangle } from './rectangle';
import { Tool } from './tool';

describe('Rectangle', () => {
    let rectangle: Rectangle;
    let topCanvas: jasmine.SpyObj<HTMLCanvasElement>;
    let topContext: jasmine.SpyObj<CanvasRenderingContext2D>;
    let middleContext: jasmine.SpyObj<CanvasRenderingContext2D>;
    const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 2,
        clientY: 2,
    });
    const mouseMoveEvent = new MouseEvent('mouseMove', {
        clientX: 2,
        clientY: 2,
    });

    beforeEach(() => {
        topCanvas = jasmine.createSpyObj('HTMLCanvasElement', ['getBoundingClientRect'], {
            width: 3,
            height: 3,
        });
        topCanvas.getBoundingClientRect.and.returnValue(new DOMRect(1, 2));
        topContext = jasmine.createSpyObj('CanvasRenderingContext2D', ['beginPath', 'stroke', 'clearRect', 'fillRect'], {
            canvas: topCanvas,
        });
        middleContext = jasmine.createSpyObj('CanvasRenderingContext2D', ['drawImage']);

        Tool.currentTopCtx = topContext;
        Tool.currentMiddleCtx = middleContext;

        TestBed.configureTestingModule({
            providers: [Rectangle],
        });

        rectangle = TestBed.inject(Rectangle);
    });

    it('toString should return "rectangle', () => {
        expect(rectangle.toString()).toEqual('rectangle');
    });

    it('should be created', () => {
        expect(rectangle).toBeTruthy();
    });

    describe('move method', () => {
        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(rectangle, 'drawSquare');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(rectangle, 'drawRectangle');
        });

        it('should set current pixels', () => {
            rectangle.move(mouseMoveEvent);
            expect(rectangle['currentX']).toEqual(1);
            expect(rectangle['currentY']).toEqual(0);
        });

        it('should call drawSquare if isSquare is true', () => {
            rectangle.isSquare = true;
            rectangle.move(mouseMoveEvent);
            expect(rectangle.drawSquare).toHaveBeenCalled();
            expect(rectangle.drawRectangle).not.toHaveBeenCalled();
        });

        it('should call drawRectangle if isSquare is false', () => {
            rectangle.isSquare = false;
            rectangle.move(mouseMoveEvent);
            expect(rectangle.drawRectangle).toHaveBeenCalled();
            expect(rectangle.drawSquare).not.toHaveBeenCalled();
        });
    });

    it('should set initial pixels and begin path', () => {
        rectangle.start(mouseDownEvent);
        expect(rectangle['initialX']).toEqual(1);
        expect(rectangle['initialY']).toEqual(0);
        expect(topContext.beginPath).toHaveBeenCalled();
    });

    it('should transfer drawing from layers', () => {
        rectangle.stop();
        expect(middleContext.drawImage.calls.mostRecent().args).toEqual([topContext.canvas, 0, 0]);
        expect(topContext.clearRect).toHaveBeenCalledWith(0, 0, topCanvas.width, topCanvas.height);
    });

    it('should call fillRect', () => {
        rectangle['initialX'] = 20;
        rectangle['initialY'] = 30;
        rectangle['currentX'] = 10;
        rectangle['currentY'] = 10;
        rectangle.drawSquare();
        expect(topContext.fillRect).toHaveBeenCalledWith(10, 20, 10, 10);
    });

    it('should transfer shape between layers', () => {
        const expectedColor = 'expectedColor';
        Tool.rectangleColor = expectedColor;
        rectangle['initialX'] = 20;
        rectangle['initialY'] = 30;
        rectangle['currentX'] = 10;
        rectangle['currentY'] = 10;

        rectangle.drawRectangle();
        expect(topContext.clearRect).toHaveBeenCalledWith(0, 0, topContext.canvas.width, topContext.canvas.height);
        expect(topContext.fillStyle).toEqual(expectedColor);
        expect(topContext.fillRect).toHaveBeenCalledWith(20, 30, -10, -20);
        expect(topContext.stroke).toHaveBeenCalled();
    });
    it('should check if enter is a function', () => {
        const returnString = rectangle.enter();
        expect(returnString).toEqual('invalid tool');
    });

    describe('drawSquare branch', () => {
        it('should set const x and const y to other values', () => {
            rectangle.isSquare = true;
            rectangle['initialX'] = 0;
            rectangle['initialY'] = 0;
            rectangle['currentX'] = 1;
            rectangle['currentY'] = 1;
            rectangle.drawSquare();
            expect(Tool.currentTopCtx.clearRect).toHaveBeenCalled();
            expect(Tool.currentTopCtx.fillRect).toHaveBeenCalledWith(0, 0, 1, 1);
            expect(Tool.currentTopCtx.stroke).toHaveBeenCalled();
        });
    });
});
