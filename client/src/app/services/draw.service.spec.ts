/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { Rectangle } from '@app/classes/rectangle';
import { Tool } from '@app/classes/tool';

import { DrawService } from './draw.service';

describe('DrawService', () => {
    let service: DrawService;
    let topCanvas: jasmine.SpyObj<HTMLCanvasElement>;
    let currentTopCtxStub: jasmine.SpyObj<CanvasRenderingContext2D>;
    let currentMiddleCtxStub: jasmine.SpyObj<CanvasRenderingContext2D>;

    const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 2,
        clientY: 2,
    });

    const keyDownEvent = new KeyboardEvent('keydown', {
        key: 'Shift',
    });

    const keyUpEvent = new KeyboardEvent('keyup', {
        key: 'Shift',
    });

    const tool = {
        // eslint-disable-next-line no-unused-vars
        start: (e: Event) => {},
        stop: () => {},
        move: () => {},
        enter: () => {},
    };

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DrawService);

        service['historyService'] = jasmine.createSpyObj('HistoryService', ['saveState'], {
            undoArr: [1, 2, 3],
        });

        topCanvas = jasmine.createSpyObj('HTMLCanvasElement', ['addEventListener', 'removeEventListener'], {
            width: 3,
            height: 3,
        });
        currentTopCtxStub = jasmine.createSpyObj('CanvasRenderingContext2D', ['beginPath', 'moveTo', 'lineTo', 'stroke', 'clearRect'], {
            canvas: topCanvas,
        });
        currentMiddleCtxStub = jasmine.createSpyObj('CanvasRenderingContext2D', ['drawImage'], {
            canvas: topCanvas,
        });

        Tool.currentTopCtx = currentTopCtxStub;
        Tool.currentMiddleCtx = currentMiddleCtxStub;

        service['topCtxLeft'] = currentTopCtxStub;
        service['topCtxRight'] = currentTopCtxStub;
        service['middleCtxLeft'] = currentMiddleCtxStub;
        service['middleCtxRight'] = currentMiddleCtxStub;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have a getter for the active tool', () => {
        service['activeTool'] = undefined;
        expect(service.tool).toEqual('');
        service['activeTool'] = new Rectangle();
        expect(service.tool).toEqual('rectangle');
    });

    it('toggleTool should toggle tool according to active tool', () => {
        const rectangle = new Rectangle();
        service['tools'] = { rectangle };
        service['activeTool'] = undefined;
        service.toggleTool('rectangle');
        expect(service['activeTool'] === rectangle).toBeTruthy();
        service.toggleTool('rectangle');
        expect(service['activeTool'] === undefined).toBeTruthy();
    });

    it('function properties should resolve correctly', () => {
        service['usingTool'] = false;
        service['activeTool'] = tool;
        service['topCtxLeft'] = currentTopCtxStub;
        service['topCtxRight'] = currentTopCtxStub;

        const startSpy = spyOn(tool, 'start');
        service['startTool'](mouseDownEvent);
        expect(service['usingTool']).toBeTruthy();
        expect(service['historyService'].saveState).toHaveBeenCalledWith(service['historyService'].undoArr, true);
        expect(topCanvas.addEventListener).toHaveBeenCalledWith('mousemove', tool.move);
        expect(topCanvas.addEventListener).toHaveBeenCalledWith('mouseover', tool.enter);
        expect(startSpy).toHaveBeenCalledWith(mouseDownEvent);
    });

    it('should set the current canvases to the ones that received the event', () => {
        service['usingTool'] = false;
        service['activeTool'] = tool;
        service['topCtxLeft'] = currentTopCtxStub;
        Object.setPrototypeOf(mouseDownEvent, { target: currentTopCtxStub.canvas });
        service['startTool'](mouseDownEvent);
        expect(Tool.currentTopCtx).toEqual(currentTopCtxStub);
        expect(Tool.currentMiddleCtx).toEqual(currentMiddleCtxStub);
    });

    it('should return immediately when tool is undefined when the tool starts', () => {
        service['usingTool'] = false;
        service['activeTool'] = tool;
        service['activeTool'] = undefined;
        service['usingTool'] = false;
        service['startTool'](mouseDownEvent);
        expect(service['usingTool']).toBeFalsy();
        expect(service['historyService'].saveState).not.toHaveBeenCalled();
    });

    it('should return immediately when tool is undefined when the tool stops', () => {
        service['usingTool'] = false;
        service['activeTool'] = tool;
        service['activeTool'] = undefined;
        service['usingTool'] = false;
        service['stopTool']();
        expect(service['usingTool']).toBeFalsy();
    });

    it('function properties should resolve correctly', () => {
        service['usingTool'] = true;
        service['activeTool'] = tool;
        const stopSpy = spyOn(tool, 'stop');
        service['stopTool']();
        expect(service['usingTool']).toBeFalsy();
        expect(currentTopCtxStub.canvas.removeEventListener).toHaveBeenCalledWith('mousemove', tool.move);
        expect(currentTopCtxStub.canvas.removeEventListener).toHaveBeenCalledWith('mouseover', tool.enter);
        expect(stopSpy).toHaveBeenCalled();
    });

    describe('changeShapeType method', () => {
        let rectangle: jasmine.SpyObj<Rectangle>;
        beforeEach(() => {
            rectangle = jasmine.createSpyObj('Rectangle', ['drawSquare', 'drawRectangle']);
            service['tools'].rectangle = rectangle;
            service['activeTool'] = rectangle;
        });

        it('should return immediately if active tool is not rectangle', () => {
            service['activeTool'] = tool;
            service['changeShapeType'](keyDownEvent);
            expect(rectangle.isSquare).toBeFalsy();
        });

        it('should return immediately if pressed key is not Shift', () => {
            service['activeTool'] = rectangle;
            service['changeShapeType'](
                new KeyboardEvent('keydown', {
                    key: 'Enter',
                }),
            );
            expect(rectangle.isSquare).toBeFalsy();
        });

        it('should not draw shape if tool is not being used', () => {
            service['usingTool'] = false;
            service['activeTool'] = rectangle;

            service['changeShapeType'](keyDownEvent);
            expect(rectangle.isSquare).toBeTruthy();
            service['changeShapeType'](keyUpEvent);
            expect(rectangle.isSquare).toBeFalsy();

            expect(rectangle.drawSquare).not.toHaveBeenCalled();
            expect(rectangle.drawRectangle).not.toHaveBeenCalled();
        });

        it('should draw square on keydown', () => {
            service['usingTool'] = true;
            service['activeTool'] = rectangle;
            service['changeShapeType'](keyDownEvent);
            expect(rectangle.drawSquare).toHaveBeenCalled();
            expect(rectangle.drawRectangle).not.toHaveBeenCalled();
        });

        it('should draw rectangle on keyup', () => {
            service['usingTool'] = true;
            service['activeTool'] = rectangle;
            service['changeShapeType'](keyUpEvent);
            expect(rectangle.drawRectangle).toHaveBeenCalled();
            expect(rectangle.drawSquare).not.toHaveBeenCalled();
        });
    });
});
