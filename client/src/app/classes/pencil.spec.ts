import { TestBed } from '@angular/core/testing';
import { Pencil } from './pencil';
import { Tool } from './tool';

describe('Pencil', () => {
    let pencil: Pencil;
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
        topContext = jasmine.createSpyObj('CanvasRenderingContext2D', ['beginPath', 'moveTo', 'lineTo', 'stroke', 'clearRect'], {
            canvas: topCanvas,
        });
        middleContext = jasmine.createSpyObj('CanvasRenderingContext2D', ['drawImage']);

        Tool.currentTopCtx = topContext;
        Tool.currentMiddleCtx = middleContext;

        TestBed.configureTestingModule({
            providers: [Pencil],
        });

        pencil = TestBed.inject(Pencil);
    });

    it('should be created', () => {
        expect(pencil).toBeTruthy();
    });

    it('toString should return "pencil', () => {
        expect(pencil.toString()).toEqual('pencil');
    });

    it('start should set and draw original stroke', () => {
        const expectedColor = 'expectedColor';
        const expectedWidth = 2;

        Tool.drawColor = expectedColor;
        Tool.drawWidth = expectedWidth;

        spyOn(pencil, 'move');

        pencil.start(mouseDownEvent);

        expect(topContext.strokeStyle).toEqual(expectedColor);
        expect(topContext.lineWidth).toEqual(expectedWidth);
        expect(topContext.beginPath).toHaveBeenCalled();
        expect(topContext.moveTo).toHaveBeenCalledWith(1, 0);
        expect(pencil.move).toHaveBeenCalledWith(mouseDownEvent);
    });

    it('move should draw stroke', () => {
        pencil.move(mouseMoveEvent);
        expect(topContext.lineTo).toHaveBeenCalledWith(1, 0);
        expect(topContext.stroke).toHaveBeenCalled();
    });

    it('stop should transfer drawing from layers', () => {
        pencil.stop();
        expect(middleContext.drawImage.calls.mostRecent().args).toEqual([topContext.canvas, 0, 0]);
        expect(topContext.clearRect).toHaveBeenCalledWith(0, 0, topCanvas.width, topCanvas.height);
    });

    it('enter should call currentTopCtx.beginPath', () => {
        pencil.enter();
        expect(topContext.beginPath).toHaveBeenCalled();
    });
});
