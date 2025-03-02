export abstract class Tool {
    static currentMiddleCtx: CanvasRenderingContext2D;
    static currentTopCtx: CanvasRenderingContext2D;

    static drawWidth: number;
    static drawColor: string;
    static eraserWidth: number;
    static rectangleColor: string;

    abstract start: (mouseEvent: MouseEvent) => void;
    abstract stop: () => void;
    abstract move: (mouseEvent: MouseEvent) => void;
    abstract enter: () => void;
    abstract toString(): string;
}
