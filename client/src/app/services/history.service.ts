import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    undoArr: string[][];
    redoArr: string[][];

    private context1: CanvasRenderingContext2D;
    private context2: CanvasRenderingContext2D;

    /**
     * Constructor of the HistoryService class.
     * Adds event listeners for the undo and redo actions.
     * Ctrl + Z calls the undoAction method which undoes the last action stored in the undoArr variable.
     * Ctrl + Shift + Z calls the redoAction method which redoes the last action stored in the redoArr variable.
     */
    constructor() {
        this.undoArr = [];
        this.redoArr = [];
        window.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'z') {
                this.undoAction();
            } else if (event.ctrlKey && event.key === 'Z') {
                this.redoAction();
            }
        });
    }

    /**
     * Initializes the left canvas as canvas1 and the right canvas as canvas2 in the class.
     *
     * @param canvas1 The canvas element of the first layer.
     * @param canvas2 The canvas element of the second layer.
     */
    initContexts(canvas1: HTMLCanvasElement, canvas2: HTMLCanvasElement): void {
        this.context1 = (canvas1.querySelector('canvas#layer-2') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
        this.context2 = (canvas2.querySelector('canvas#layer-2') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
    }

    /**
     * Saves the current state of the canvases in the undoArr array.
     * If the clearRedo parameter is true, the redoArr array is emptied.
     *
     * @param arr The array in which the current state of the canvases should be saved.
     * @param keepRedo A boolean value that indicates whether the redoArr array should be emptied.
     */
    saveState(arr: string[][], clearRedo: boolean): void {
        if (clearRedo) {
            this.redoArr = [];
        }

        arr.push([this.context1.canvas.toDataURL(), this.context2.canvas.toDataURL()]);
    }

    /**
     * Undoes the user's previous action, which is the last value stored in the undoArr.
     */
    undoAction(): void {
        this.restoreState(this.undoArr, this.redoArr);
    }

    /**
     * Redoes the user's previous action, which is the last value stored in the redoArr.
     */
    redoAction(): void {
        this.restoreState(this.redoArr, this.undoArr);
    }

    /**
     * Restores the state of the canvases to the last value stored in the pop array.
     * The last value is then saved in the push array.
     *
     * @param pop The array from which the last value should be taken.
     * @param push The array in which the last value should be saved.
     */
    private restoreState(pop: string[][], push: string[][]): void {
        if (pop.length) {
            this.saveState(push, false);

            const restoreState = pop.pop();

            this.drawCanvas(this.context2, (restoreState as string[]).pop() as string);
            this.drawCanvas(this.context1, (restoreState as string[]).pop() as string);
        }
    }

    /**
     * Draws an image on the context of the canvas given as parameter.
     * The image is taken from the source parameter.
     *
     * @param context The context of the canvas on which the image should be drawn.
     * @param source The source of the image that should be drawn.
     */
    private drawCanvas(context: CanvasRenderingContext2D, source: string): void {
        const image = new Image();
        image.src = source;
        image.onload = () => {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            context.drawImage(image, 0, 0);
        };
    }
}
