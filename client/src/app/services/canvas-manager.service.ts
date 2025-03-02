import { Injectable } from '@angular/core';
import { HistoryService } from './history.service';

@Injectable({
    providedIn: 'root',
})
export class CanvasManagerService {
    private context1: CanvasRenderingContext2D;
    private context2: CanvasRenderingContext2D;

    /**
     * @param historyService service used to enable undo/redo actions.
     */
    constructor(private historyService: HistoryService) {}

    /**
     * Initialize the contexts in the class attributes.
     * The left canvas is canvas1 and the right canvas is canvas2.
     *
     * @param canvas1 the left canvas.
     * @param canvas2 the right canvas.
     */
    initContexts(canvas1: HTMLCanvasElement, canvas2: HTMLCanvasElement): void {
        this.context1 = (canvas1.querySelector('canvas#layer-2') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
        this.context2 = (canvas2.querySelector('canvas#layer-2') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
    }

    /**
     * Resets the canvas given as parameter (second layer of the ImageInputComponent) to its original state.
     * This only applies to the draw layer. The background layer is not affected.
     *
     * @param canvas the canvas to clear.
     */
    resetOverlay(canvas: HTMLCanvasElement): void {
        this.historyService.saveState(this.historyService.undoArr, true);

        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Swaps the overlays of the two canvases.
     * This only applies to the draw layer. The background layer is not affected.
     */
    swapOverlays(): void {
        this.historyService.saveState(this.historyService.undoArr, true);

        this.drawCanvas(this.context1.canvas, this.context2.canvas);
        this.drawCanvas(this.context2.canvas, this.context1.canvas);
    }

    /**
     * Draws the other canvas on the overlay of the canvas given as parameter.
     * This only applies to the draw layer. The background layer is not affected.
     *
     * @param destination the canvas on which the other canvas should be drawn.
     * The value can be 'toLeft' or 'toRight'.
     */
    duplicate(destination: string): void {
        this.historyService.saveState(this.historyService.undoArr, true);

        if (destination === 'toLeft') {
            this.drawCanvas(this.context1.canvas, this.context2.canvas);
        } else {
            this.drawCanvas(this.context2.canvas, this.context1.canvas);
        }
    }

    /**
     * Draws the canvas given as parameter canvasFrom on the canvas given as parameter canvasTo.
     *
     * @param canvasTo the canvas on which the other canvas should be drawn.
     * @param canvasFrom the canvas that should be drawn on the other canvas.
     */
    private drawCanvas(canvasTo: HTMLCanvasElement, canvasFrom: HTMLCanvasElement): void {
        const dataFrom = canvasFrom.toDataURL();
        const image = new Image();
        image.src = dataFrom;
        image.onload = () => {
            (canvasTo.getContext('2d') as CanvasRenderingContext2D).clearRect(0, 0, canvasTo.width, canvasTo.height);
            (canvasTo.getContext('2d') as CanvasRenderingContext2D).drawImage(image, 0, 0);
        };
    }
}
