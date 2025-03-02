import { Injectable } from '@angular/core';
import { Eraser } from '@app/classes/eraser';
import { Pencil } from '@app/classes/pencil';
import { Rectangle } from '@app/classes/rectangle';
import { Tool } from '@app/classes/tool';
import { DrawConstants } from '@app/constants/constants';
import { HistoryService } from './history.service';

@Injectable({
    providedIn: 'root',
})
export class DrawService {
    private middleCtxLeft: CanvasRenderingContext2D;
    private middleCtxRight: CanvasRenderingContext2D;
    private topCtxLeft: CanvasRenderingContext2D;
    private topCtxRight: CanvasRenderingContext2D;

    private usingTool: boolean;
    private activeTool: Tool | undefined;
    private tools: { [key: string]: Tool };

    constructor(private historyService: HistoryService) {
        this.tools = {
            pencil: new Pencil(),
            eraser: new Eraser(),
            rectangle: new Rectangle(),
        };
    }

    get tool() {
        return this.activeTool ? this.activeTool.toString() : '';
    }

    /**
     * Initializes the draw service.
     * Initialize the contexts with top layer and draw layer.
     * Initialize the tool functions and the tool properties.
     * Adds event listeners to the top layer of both canvases to handle mousedown, mouseup, keydown adn keyup events.
     *
     * @param canvas1 the left canvas.
     * @param canvas2 the right canvas.
     */
    initContexts(canvas1: HTMLCanvasElement, canvas2: HTMLCanvasElement): void {
        Tool.drawColor = DrawConstants.DefaultColor;
        Tool.drawWidth = DrawConstants.DefaultWidth;
        Tool.rectangleColor = DrawConstants.DefaultColor;
        Tool.eraserWidth = DrawConstants.DefaultWidth;

        this.middleCtxLeft = (canvas1.querySelector('canvas#layer-2') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
        this.middleCtxRight = (canvas2.querySelector('canvas#layer-2') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
        this.topCtxLeft = (canvas1.querySelector('canvas#layer-3') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
        this.topCtxRight = (canvas2.querySelector('canvas#layer-3') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;

        this.topCtxLeft.lineJoin = 'round';
        this.topCtxLeft.lineCap = 'round';
        this.topCtxRight.lineJoin = 'round';
        this.topCtxRight.lineCap = 'round';
        this.middleCtxLeft.lineCap = 'square';
        this.middleCtxRight.lineCap = 'square';

        this.topCtxLeft.canvas.addEventListener('mousedown', this.startTool);
        this.topCtxRight.canvas.addEventListener('mousedown', this.startTool);
        window.addEventListener('mouseup', this.stopTool);
        window.addEventListener('keydown', this.changeShapeType);
        window.addEventListener('keyup', this.changeShapeType);
    }

    /**
     * Enables or disables the tool given as parameter.
     *
     * @param tool The tool to enable. Values can be 'pencil', 'rectangle' or 'eraser'.
     */
    toggleTool(tool: string): void {
        const newTool = this.tools[tool];
        this.activeTool = this.activeTool === newTool ? undefined : newTool;
    }

    /**
     * Global event handler that resolves which tool's functions to call for mousedown and
     * to add as event handlers for mousemove and mouseover.
     *
     * @param event the mousedown event.
     */
    private startTool = (event: MouseEvent) => {
        if (!this.activeTool) return;

        if (event.target === this.topCtxLeft.canvas) {
            Tool.currentMiddleCtx = this.middleCtxLeft;
            Tool.currentTopCtx = this.topCtxLeft;
        } else {
            Tool.currentMiddleCtx = this.middleCtxRight;
            Tool.currentTopCtx = this.topCtxRight;
        }

        this.usingTool = true;
        this.historyService.saveState(this.historyService.undoArr, true);
        Tool.currentTopCtx.canvas.addEventListener('mousemove', this.activeTool.move);
        Tool.currentTopCtx.canvas.addEventListener('mouseover', this.activeTool.enter);
        this.activeTool.start(event);
    };

    /**
     * Global event handler that resolves which tool's functions to call for mouseup and
     * to remove from event handlers for mousemove and mouseover.
     */
    private stopTool = () => {
        if (!this.activeTool) return;
        this.usingTool = false;
        Tool.currentTopCtx.canvas.removeEventListener('mousemove', this.activeTool.move);
        Tool.currentTopCtx.canvas.removeEventListener('mouseover', this.activeTool.enter);
        this.activeTool.stop();
    };

    /**
     * Event handler which switches to or from square shape drawing.
     *
     * @param event the KeyBoardEvent
     */
    private changeShapeType = (event: KeyboardEvent) => {
        if (this.activeTool === this.tools.rectangle && event.key === 'Shift') {
            const rectangle = this.activeTool as Rectangle;
            rectangle.isSquare = event.type === 'keydown';
            if (!this.usingTool) return;
            if (rectangle.isSquare) rectangle.drawSquare();
            else rectangle.drawRectangle();
        }
    };
}
