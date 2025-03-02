import { Injectable } from '@angular/core';
import { GameFeedbackConstants, ImageConstants, QUADRANT_SIZES } from '@app/constants/constants';
import { PlayAreaLayers } from '@app/interfaces/play-area-layers';
import { Pixel } from '@common/pixel';

/**
 * Displays found differences and errors on the PlayAreaComponents' canvas layers
 *
 * @description
 * This service draws or flickers found differences, validated by the server, one layer above the images canvas.
 * It also draws and clears errors on a separate layer. This division by layers allows for simple operations, as
 * a modification never alters the images canvas and can thus be easily reverted.
 */
@Injectable({
    providedIn: 'root',
})
export class GameFeedbackService {
    isCheating: boolean;
    currentErrorCtx: CanvasRenderingContext2D;
    nbClues: number;

    private flickerSpeed: number;
    private cheatingSpeed: number;

    private leftLayers: PlayAreaLayers;
    private rightLayers: PlayAreaLayers;
    private leftData: Uint8ClampedArray;
    private rightData: Uint8ClampedArray;

    private tempCanvas: HTMLCanvasElement;
    private tempCtx: CanvasRenderingContext2D;

    private flickerOuter: ReturnType<typeof setInterval>;
    private flickerInner: ReturnType<typeof setInterval>;

    private flickerTimeoutId: ReturnType<typeof setTimeout>;
    private isFlickering: boolean;

    constructor() {
        this.isCheating = false;
        this.flickerSpeed = GameFeedbackConstants.FlickerDelay;
        this.cheatingSpeed = GameFeedbackConstants.CheatFlickerDelay;

        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = ImageConstants.DefaultWidth;
        this.tempCanvas.height = ImageConstants.DefaultHeight;
        this.tempCtx = this.tempCanvas.getContext('2d') as CanvasRenderingContext2D;
    }

    get left(): PlayAreaLayers {
        return this.leftLayers;
    }

    get right(): PlayAreaLayers {
        return this.rightLayers;
    }

    /**
     * Initializes images and found differences CanvasRenderingContext2Ds. Stores images data.
     * Should be called after both images have loaded on their canvas in PlayAreaComponent.
     *
     * @param leftLayers The original canvas image and differences layers, as CanvasRenderingContext2ds.
     * @param rightLayers The modified canvas image and differences layers, as CanvasRenderingContext2ds.
     */
    initData(leftLayers: PlayAreaLayers, rightLayers: PlayAreaLayers) {
        this.leftLayers = leftLayers;
        this.leftData = leftLayers.image.getImageData(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight).data;
        this.rightLayers = rightLayers;
        this.rightData = rightLayers.image.getImageData(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight).data;
    }

    setFlickerSpeed(speed: number) {
        this.flickerSpeed = GameFeedbackConstants.FlickerDelay / speed;
        this.cheatingSpeed = GameFeedbackConstants.CheatFlickerDelay / speed;
        this.rightLayers.clue.canvas.style.animationDuration = (GameFeedbackConstants.FlickerAnimationFactor / this.flickerSpeed).toLocaleString();
        this.leftLayers.clue.canvas.style.animationDuration = (GameFeedbackConstants.FlickerAnimationFactor / this.flickerSpeed).toLocaleString();
    }

    /**
     * Draws an original canvas' difference on the modified canvas, flickering it if isCheating is false.
     *
     * @param difference The array of pixels to draw.
     */
    drawDifference(difference: Pixel[]) {
        this.clearClueCanvas();
        if (this.isCheating) this.patchDifference(difference, this.leftData);
        else this.flicker(difference, GameFeedbackConstants.NbFlickers);
    }

    /**
     * Draws word 'Erreur' at specified position. Should be called after currentErrorCtx is set to last clicked canvas' context.
     *
     * @param pixel The position at which to draw word on currentErrorCtx.
     */
    drawError(pixel: Pixel) {
        this.currentErrorCtx.fillText('Erreur', pixel.x, pixel.y);
    }

    /**
     * Clears word 'Error' on currentErrorCtx. Should be called after user is unfrozen from an error.
     * currentErrorCtx should not have changed while user was frozen.
     */
    clearError() {
        this.currentErrorCtx.clearRect(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
    }

    /**
     * Toggles cheating. isCheating should be set with this method to trigger differences flickering.
     * isCheating can be set directly to false if cheating shouldn't carry through multiple games.
     */
    toggleCheat() {
        this.isCheating = !this.isCheating;
        if (this.isCheating && !this.isFlickering) this.flickerCheat();
    }

    /**
     * Creates visual feedback on usage of a clue.
     *
     * @param pixels The pixel from which to compute the clue quadrant, or pixels to shake for the third custom clue.
     */
    useClue(pixels: Pixel[]) {
        this.clearClueCanvas();
        if (this.nbClues > 1) {
            this.leftLayers.clue.canvas.classList.remove('shake');
            this.rightLayers.clue.canvas.classList.remove('shake');
            this.leftLayers.clue.fillStyle = 'rgba(0, 255, 0, 0.3)';
            this.rightLayers.clue.fillStyle = 'rgba(0, 255, 0, 0.3)';

            const sizeIndex = this.nbClues-- - 2;
            const x = QUADRANT_SIZES[sizeIndex].width * Math.floor(pixels[0].x / QUADRANT_SIZES[sizeIndex].width);
            const y = QUADRANT_SIZES[sizeIndex].height * Math.floor(pixels[0].y / QUADRANT_SIZES[sizeIndex].height);
            this.leftLayers.clue.fillRect(x, y, QUADRANT_SIZES[sizeIndex].width, QUADRANT_SIZES[sizeIndex].height);
            this.rightLayers.clue.fillRect(x, y, QUADRANT_SIZES[sizeIndex].width, QUADRANT_SIZES[sizeIndex].height);
        } else if (this.nbClues-- === 1) {
            this.leftData = this.leftLayers.image.getImageData(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight).data;
            this.rightData = this.rightLayers.image.getImageData(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight).data;
            this.patchDifference(pixels);
            this.leftLayers.clue.canvas.classList.add('shake');
            this.rightLayers.clue.canvas.classList.add('shake');
        }
    }

    /**
     * Synchronizes clues and cheat flickering effects with the newly downloaded images, should be called on difference
     * found in limited time game.
     */
    synchronizeNewSheet() {
        this.clearClueCanvas();
        clearTimeout(this.flickerTimeoutId);
        if (this.isCheating) this.flickerCheat();
    }

    /**
     * Removes all differences from the difference layers.
     * Called when a user starts the replay of a game to put the layers back to their original state.
     */
    clearDifferences() {
        this.leftLayers.diff.clearRect(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
        this.rightLayers.diff.clearRect(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
    }

    /**
     * Clears all timeouts set by this service when a difference flickers.
     * This is necessary to prevent flickering when a user viewing a replay presses the restart button while a difference is flickering.
     */
    clearTimeouts() {
        clearTimeout(this.flickerOuter);
        clearTimeout(this.flickerInner);
    }

    /**
     * Clears green quadrant overlay for clue, should be called when a difference is found or when the images change.
     */
    clearClueCanvas() {
        this.leftLayers.clue.clearRect(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
        this.rightLayers.clue.clearRect(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
    }

    /**
     * Swaps the image layers and repeats until isCheating is false.
     */
    private flickerCheat() {
        this.isFlickering = true;
        this.flickerTimeoutId = setTimeout(() => {
            this.tempCtx.drawImage(this.leftLayers.image.canvas, 0, 0);
            this.leftLayers.image.drawImage(this.rightLayers.image.canvas, 0, 0);
            this.rightLayers.image.drawImage(this.tempCanvas, 0, 0);
            this.flickerTimeoutId = setTimeout(() => {
                this.rightLayers.image.drawImage(this.leftLayers.image.canvas, 0, 0);
                this.leftLayers.image.drawImage(this.tempCanvas, 0, 0);
                if (this.isCheating) this.flickerCheat();
                else this.isFlickering = false;
            }, this.cheatingSpeed);
        }, this.cheatingSpeed);
    }

    /**
     * Swaps the difference layers with newly drawn difference from the image layers, repeating for flickering effect.
     *
     * @param difference The array of pixels to draw and swap.
     * @param count The remaining number of times to swap layers.
     */
    private flicker(difference: Pixel[], count: number) {
        this.flickerOuter = setTimeout(() => {
            this.patchDifference(difference, this.rightData);
            this.flickerInner = setTimeout(() => {
                this.patchDifference(difference, this.leftData);
                if (--count > 0) this.flicker(difference, count);
            }, this.flickerSpeed);
        }, this.flickerSpeed);
    }

    /**
     * Takes an array of coordinates and draws from the specified data onto difference layers.
     *
     * @param difference The pixels which to take from specified data.
     * @param data The canvas' image data to use for drawing on the difference layers.
     */
    private patchDifference(difference: Pixel[], data: Uint8ClampedArray | undefined = undefined) {
        let fillStyle;
        difference.forEach((pixel) => {
            const i = (pixel.x + pixel.y * ImageConstants.DefaultWidth) * ImageConstants.RgbaComponentsPerPixel;
            if (data) {
                fillStyle = `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`;
                this.drawOnCanvas(this.rightLayers.diff, fillStyle, pixel);
                this.drawOnCanvas(this.leftLayers.diff, fillStyle, pixel);
            } else {
                fillStyle = `rgb(${this.rightData[i]}, ${this.rightData[i + 1]}, ${this.rightData[i + 2]})`;
                this.drawOnCanvas(this.rightLayers.clue, fillStyle, pixel);
                fillStyle = `rgb(${this.leftData[i]}, ${this.leftData[i + 1]}, ${this.leftData[i + 2]})`;
                this.drawOnCanvas(this.leftLayers.clue, fillStyle, pixel);
            }
        });
    }

    /**
     * Draws on a single layer with given fillStyle, at given pixel.
     *
     * @param context The CanvasRenderingContext2d of the layer on which to draw.
     * @param fillStyle The color of the pixel to be drawn.
     * @param pixel The coordinate at which to draw on the layer.
     */
    private drawOnCanvas(context: CanvasRenderingContext2D, fillStyle: string, pixel: Pixel): void {
        context.fillStyle = fillStyle;
        context.fillRect(pixel.x, pixel.y, 1, 1);
    }
}
