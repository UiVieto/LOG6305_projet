import { Tool } from './tool';

export class Rectangle extends Tool {
    isSquare: boolean;
    private initialX: number;
    private initialY: number;
    private currentY: number;
    private currentX: number;

    /**
     * Event handler for the mousedown event of the rectangle tool.
     *
     * @param event the mousedown event.
     */
    start = (event: MouseEvent) => {
        this.initialX = event.clientX - Tool.currentTopCtx.canvas.getBoundingClientRect().left;
        this.initialY = event.clientY - Tool.currentTopCtx.canvas.getBoundingClientRect().top;

        Tool.currentTopCtx.beginPath();
    };

    stop = () => {
        Tool.currentMiddleCtx.drawImage(Tool.currentTopCtx.canvas, 0, 0);
        Tool.currentTopCtx.clearRect(0, 0, Tool.currentTopCtx.canvas.width, Tool.currentTopCtx.canvas.height);
    };

    /**
     * Event handler for the mousemove event of the rectangle tool. Draws either a rectangle or a square depending on if the Shift key is pressed.
     *
     * @param event the mousemove event.
     */
    move = (event: MouseEvent) => {
        this.currentX = event.clientX - Tool.currentTopCtx.canvas.getBoundingClientRect().left;
        this.currentY = event.clientY - Tool.currentTopCtx.canvas.getBoundingClientRect().top;

        if (this.isSquare) this.drawSquare();
        else this.drawRectangle();
    };

    enter = (): string => {
        return 'invalid tool';
    };

    /**
     * Draws the square with the rectangle color.
     * Handles four cases according to the position of the initial click of the user and the direction he drags the rectangle toward.
     */
    drawSquare(): void {
        Tool.currentTopCtx.clearRect(0, 0, Tool.currentTopCtx.canvas.width, Tool.currentTopCtx.canvas.height);

        const width = Math.abs(this.currentX - this.initialX);
        const height = Math.abs(this.currentY - this.initialY);
        const length = Math.min(width, height);
        const x = this.initialX + (this.currentX > this.initialX ? 0 : -length);
        const y = this.initialY + (this.currentY > this.initialY ? 0 : -length);

        Tool.currentTopCtx.fillRect(x, y, length, length);
        Tool.currentTopCtx.stroke();
    }

    /**
     * Draws a rectangle with the rectangle color.
     */
    drawRectangle(): void {
        Tool.currentTopCtx.clearRect(0, 0, Tool.currentTopCtx.canvas.width, Tool.currentTopCtx.canvas.height);
        Tool.currentTopCtx.fillStyle = Tool.rectangleColor;
        Tool.currentTopCtx.fillRect(this.initialX, this.initialY, this.currentX - this.initialX, this.currentY - this.initialY);
        Tool.currentTopCtx.stroke();
    }

    toString() {
        return 'rectangle';
    }
}
