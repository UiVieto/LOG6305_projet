import { DrawConstants } from '@app/constants/constants';
import { Tool } from './tool';

export class Eraser extends Tool {
    private initialX: number;
    private initialY: number;

    /**
     * Global event handler for mousedown event when the eraser tool is enabled
     *
     * @param event the mousedown event
     */
    start = (mouseEvent: MouseEvent) => {
        Tool.currentMiddleCtx.globalCompositeOperation = 'destination-out';
        Tool.currentMiddleCtx.lineWidth = Tool.eraserWidth;
        this.initialX = mouseEvent.clientX - Tool.currentMiddleCtx.canvas.getBoundingClientRect().left;
        this.initialY = mouseEvent.clientY - Tool.currentMiddleCtx.canvas.getBoundingClientRect().top;
        Tool.currentMiddleCtx.clearRect(
            this.initialX - Tool.eraserWidth / 2,
            this.initialY - Tool.eraserWidth / 2,
            Tool.eraserWidth,
            Tool.eraserWidth,
        );
    };

    stop = () => {
        Tool.currentMiddleCtx.globalCompositeOperation = 'source-over';
    };

    /**
     * Global event handler for mousemove event when the eraser tool is enabled
     * Erases a line between the last position and the current position.
     * The line is drawn with a fixed axis, so that the line is always square (no pointy shapes).
     *
     * @param event the mousemove event
     */
    move = (event: MouseEvent) => {
        const endX = event.clientX - Tool.currentMiddleCtx.canvas.getBoundingClientRect().left;
        const endY = event.clientY - Tool.currentMiddleCtx.canvas.getBoundingClientRect().top;
        const deltaX = Math.abs(this.initialX - endX);
        const deltaY = Math.abs(this.initialY - endY);
        const signX = this.initialX < endX ? 1 : DrawConstants.NegativeStep;
        const signY = this.initialY < endY ? 1 : DrawConstants.NegativeStep;

        if (deltaX > deltaY)
            this.eraseFixedAxis([signX * 2, 0, signX * DrawConstants.EraseSteps, signY * (deltaY / deltaX) * DrawConstants.EraseSteps], deltaX);
        else {
            this.eraseFixedAxis([0, signY * 2, signX * (deltaX / deltaY) * DrawConstants.EraseSteps, signY * DrawConstants.EraseSteps], deltaY);
        }
    };

    enter = () => {
        Tool.currentMiddleCtx.beginPath();
    };

    toString() {
        return 'eraser';
    }

    /**
     * Erases a line between the last position and the current position.
     * The line is drawn with a fixed axis, so that the line is always square (no pointy shapes).
     *
     * @param steps the steps to take to draw the line
     * @param directionDelta the number of steps to take
     */
    private eraseFixedAxis(steps: number[], directionDelta: number): void {
        for (let i = 0; i < directionDelta; i += DrawConstants.EraseSteps) {
            Tool.currentMiddleCtx.beginPath();
            Tool.currentMiddleCtx.moveTo(this.initialX, this.initialY);
            Tool.currentMiddleCtx.lineTo(this.initialX + steps[0], this.initialY + steps[1]);
            Tool.currentMiddleCtx.stroke();
            this.initialX += steps[2];
            this.initialY += steps[3];
        }
    }
}
