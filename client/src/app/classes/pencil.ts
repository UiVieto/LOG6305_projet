import { Tool } from './tool';

export class Pencil extends Tool {
    /**
     * Starts a CanvasRenderingContext2D path for drawing or erasing, based on canvas position.
     *
     * @param event the MouseEvent.
     * @param layer the CanvasRenderingContext2D to use.
     */
    start = (mouseEvent: MouseEvent) => {
        Tool.currentTopCtx.strokeStyle = Tool.drawColor;
        Tool.currentTopCtx.lineWidth = Tool.drawWidth;
        Tool.currentTopCtx.beginPath();
        Tool.currentTopCtx.moveTo(
            mouseEvent.clientX - Tool.currentTopCtx.canvas.getBoundingClientRect().left,
            mouseEvent.clientY - Tool.currentTopCtx.canvas.getBoundingClientRect().top,
        );
        this.move(mouseEvent);
    };

    /**
     * Event handler for the mouseup event of the pencil tool.
     */
    stop = () => {
        Tool.currentMiddleCtx.drawImage(Tool.currentTopCtx.canvas, 0, 0);
        Tool.currentTopCtx.clearRect(0, 0, Tool.currentTopCtx.canvas.width, Tool.currentTopCtx.canvas.height);
    };

    /**
     * Draws or erases a line according to the layer's path.
     *
     * @param event the MouseEvent
     */
    move = (event: MouseEvent) => {
        Tool.currentTopCtx.lineTo(
            event.clientX - Tool.currentTopCtx.canvas.getBoundingClientRect().left,
            event.clientY - Tool.currentTopCtx.canvas.getBoundingClientRect().top,
        );
        Tool.currentTopCtx.stroke();
    };

    enter = () => {
        Tool.currentTopCtx.beginPath();
    };

    toString() {
        return 'pencil';
    }
}
