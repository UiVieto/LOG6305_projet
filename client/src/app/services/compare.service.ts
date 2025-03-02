import { Injectable } from '@angular/core';
import { ImageConstants } from '@app/constants/constants';
import { Game } from '@common/game';
import { Pixel } from '@common/pixel';
import { Observable } from 'rxjs';
import { CommunicationService } from './communication.service';

/**
 * Compares the creation page's canvas to create and upload a game.
 *
 * @description
 * This service validates and displays two user-provided images
 * to generate a black and white canvas representing their differences.
 * It computes the sets of differences' pixel coordinates to facilitate
 * future evaluation of user inputs on the server where the game is uploaded.
 */
@Injectable({
    providedIn: 'root',
})
export class CompareService {
    private baseContext1: CanvasRenderingContext2D;
    private baseContext2: CanvasRenderingContext2D;

    private overContext1: CanvasRenderingContext2D;
    private overContext2: CanvasRenderingContext2D;

    private differencesContext: CanvasRenderingContext2D;
    private differencesCoords: Pixel[][];

    private virtualCanvas1: HTMLCanvasElement;
    private virtualCanvas2: HTMLCanvasElement;

    private virtualContext1: CanvasRenderingContext2D;
    private virtualContext2: CanvasRenderingContext2D;

    constructor(public communicationService: CommunicationService) {
        this.virtualCanvas1 = document.createElement('canvas');
        this.virtualCanvas2 = document.createElement('canvas');
        this.differencesCoords = [];
    }

    get isComparable() {
        return (
            this.baseContext1 &&
            this.baseContext2 &&
            this.baseContext1.getImageData(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight).data.some((channel) => channel !== 0) &&
            this.baseContext2.getImageData(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight).data.some((channel) => channel !== 0)
        );
    }

    /**
     * Initializes the service's CanvasRenderingContext2Ds'. Should be called after the view is loaded.
     * Sets the virtual canvas' dimensions to the default image dimensions. These canvases are used to merge the layers.
     *
     * @param original The left canvas' ImageInputComponent.
     * @param modified The right canvas' ImageInputComponent.
     */
    // More than maximum params is allowed because creating an interface for this few canvas layers would not improve readability significantly
    // eslint-disable-next-line max-params
    initContexts(
        originalLayer1: CanvasRenderingContext2D,
        originalLayer2: CanvasRenderingContext2D,
        modifiedLayer1: CanvasRenderingContext2D,
        modifiedLayer2: CanvasRenderingContext2D,
    ): void {
        this.baseContext1 = originalLayer1;
        this.baseContext2 = modifiedLayer1;

        this.overContext1 = originalLayer2;
        this.overContext2 = modifiedLayer2;

        this.setVirtualCanvasSize();

        this.virtualContext1 = this.virtualCanvas1.getContext('2d') as CanvasRenderingContext2D;
        this.virtualContext2 = this.virtualCanvas2.getContext('2d') as CanvasRenderingContext2D;
    }

    /**
     * Sets the differenceContext attribute to the context given as parameter.
     * The context is used to draw the differences between the two images in the pop-up component.
     *
     * @param differencesContext The context of the canvas to be used to draw the differences.
     */
    initDifferencesCanvas(differencesContext: CanvasRenderingContext2D): void {
        this.differencesContext = differencesContext;
    }

    /**
     * Verifies the input's file, image format, bit depth and resolution before displaying on the canvas
     * (displays on both original and modified if no context is provided).
     *
     * @param file The input containing the image.
     * @param context The specific context with which to display, if not both.
     * @returns The asynchronous error or validation message.
     */
    async drawImage(file: File, context?: CanvasRenderingContext2D) {
        // Reads file
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        const view = await new Promise<DataView>((resolve) => {
            reader.onload = () => resolve(new DataView(reader.result as ArrayBuffer));
        });

        // Verifies BMP format
        if (view.getUint8(0) !== ImageConstants.BmpFormat0 || view.getUint8(1) !== ImageConstants.BmpFormat1)
            return 'Le fichier doit être dans un format BMP';

        // Verifies 24 bit depth
        if (view.getUint16(ImageConstants.BitDepthOffset, true) !== ImageConstants.BitDepth24) return 'Le fichier BMP doit être 24-bit';

        // Generates image
        const newImage = new Image();
        newImage.src = window.URL.createObjectURL(file);
        await new Promise<HTMLImageElement>((resolve) => {
            newImage.onload = () => resolve(newImage);
        });

        // Verifies resolution
        if (newImage.naturalWidth !== ImageConstants.DefaultWidth || newImage.naturalHeight !== ImageConstants.DefaultHeight)
            return "L'image doit être de résolution 640 x 480 pixels";

        // Draws image(s)
        if (context) context.drawImage(newImage, 0, 0);
        else {
            this.baseContext1.drawImage(newImage, 0, 0);
            this.baseContext2.drawImage(newImage, 0, 0);
        }
        return '';
    }

    /**
     * Resets a canvas' display.
     *
     * @param context The context of the canvas to be reset.
     */
    clearImage(context: CanvasRenderingContext2D): void {
        context.clearRect(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
    }

    /**
     * Compares the original and modified canvas to draw the differences on the third.
     *
     * @param enlargement The value by which to enlarge the drawn different pixels.
     */
    drawDifferences(enlargement: number): void {
        // Resets the differences canvas
        this.differencesContext.fillStyle = 'white';
        this.differencesContext.fillRect(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
        this.differencesContext.fillStyle = 'black';

        // Gets original and modified images data
        const originalData = this.virtualContext1.getImageData(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight).data;
        const modifiedData = this.virtualContext2.getImageData(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight).data;

        for (let y = 0; y < ImageConstants.DefaultHeight; y++) {
            for (let x = 0; x < ImageConstants.DefaultWidth; x++) {
                // Converts x and y coordinates into an RGBA array index
                const i = (x + y * ImageConstants.DefaultWidth) * ImageConstants.RgbaComponentsPerPixel;

                // Compares pixels under an arbitrary tolerance
                if (
                    Math.abs(originalData[i] - modifiedData[i]) +
                        Math.abs(originalData[i + 1] - modifiedData[i + 1]) +
                        Math.abs(originalData[i + 2] - modifiedData[i + 2]) >
                    ImageConstants.RgbaTolerance
                )
                    // Draws the difference according to enlargement
                    this.differencesContext.fillRect(
                        Math.max(x - enlargement, 0),
                        Math.max(y - enlargement, 0),
                        1 + Math.min(ImageConstants.DefaultWidth - x - 1, enlargement) + Math.min(x, enlargement),
                        1 + Math.min(ImageConstants.DefaultWidth - y - 1, enlargement) + Math.min(y, enlargement),
                    );
            }
        }
    }

    /**
     * Counts the number of differences to set the game's validity for upload.
     *
     * @returns An object containing the computed difficulty and number of differences.
     */
    validateDifferences() {
        this.differencesCoords = [];
        let data = this.differencesContext.getImageData(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight).data;

        for (let y = 0; y < ImageConstants.DefaultHeight; y++)
            for (let x = 0; x < ImageConstants.DefaultWidth; x++)
                if (data[(x + y * ImageConstants.DefaultWidth) * ImageConstants.RgbaComponentsPerPixel] === 0) data = this.floodFill(x, y, data);

        return { difficulty: this.getDifficulty(), nbDifferences: this.differencesCoords.length };
    }

    /**
     * Creates a game with the correct settings provided by the compare service.
     * It then uses an observable to post the new game to the server with the communication service.
     *
     * @param gameTitle a string representing the title of the game.
     * @param diff a string representing the difficulty level of the game.
     * @returns a boolean observable that depends on the titleExistsGet request of the communication service.
     */
    createGame(gameTitle: string, diff: string): Observable<boolean> {
        const myObservable = this.communicationService.titleExistsGet(gameTitle);

        myObservable.subscribe((exists: boolean) => {
            if (!exists) {
                const firstImage = this.virtualCanvas1.toDataURL();
                const secondImage = this.virtualCanvas2.toDataURL();

                const game: Game = {
                    title: gameTitle,
                    image1: firstImage,
                    image2: secondImage,
                    differences: this.differencesCoords,
                    bestTimes: {
                        solo: [],
                        versus: [],
                    },
                    isHard: diff === 'difficile',
                };
                this.communicationService.createGamePost(game).subscribe();
                this.clearImage(this.virtualContext1);
                this.clearImage(this.virtualContext2);
            }
        });
        return myObservable;
    }

    /**
     * Merges the first and second layer of the ImageInputComponents into a single virtual canvas (not displayed anywhere).
     * Draws the second layers (function parameters) on the service's context attributes.
     *
     * @param originalLayer the second layer of the left ImageInputComponent.
     * @param modifiedLayer the second layer of the right ImageInputComponent.
     */
    mergeCanvases(): void {
        this.virtualContext1.drawImage(this.baseContext1.canvas, 0, 0);
        this.virtualContext1.drawImage(this.overContext1.canvas, 0, 0);
        this.virtualContext2.drawImage(this.baseContext2.canvas, 0, 0);
        this.virtualContext2.drawImage(this.overContext2.canvas, 0, 0);
    }

    /**
     * Performs the flood fill algorithm to find a set of different pixels based on initial coordinates and
     * the up-to-date image data.
     *
     * @param x0 The initial x coordinate.
     * @param y0 The initial y coordinate.
     * @param data The initial image data.
     * @returns The image data updated with marked found pixels.
     */
    private floodFill(x0: number, y0: number, data: Uint8ClampedArray): Uint8ClampedArray {
        const queue = [[x0, y0]]; // Queues the initial pixel
        const differenceCoords: Pixel[] = [];
        while (queue.length) {
            const [x, y] = queue.pop() as number[];
            const i = (x + y * ImageConstants.DefaultWidth) * ImageConstants.RgbaComponentsPerPixel; // Computes RGBA index
            // Evaluates if pixel has been visited
            if (data[i] === 0) {
                differenceCoords.push({ x, y });
                data[i] = 1;

                // Queues adjacent pixels
                [
                    [x - 1, y],
                    [x + 1, y],
                    [x, y - 1],
                    [x, y + 1],
                    [x - 1, y - 1],
                    [x + 1, y - 1],
                    [x - 1, y + 1],
                    [x + 1, y + 1],
                ].forEach(([xx, yy]) => {
                    const xxInBounds = xx >= 0 && xx < ImageConstants.DefaultWidth;
                    const yyInBounds = yy >= 0 && yy < ImageConstants.DefaultHeight;
                    if (xxInBounds && yyInBounds) queue.push([xx, yy]);
                });
            }
        }
        this.differencesCoords.push(differenceCoords); // Adds difference to the set
        return data;
    }

    /**
     * Determines a valid game's difficulty by the number of differences and different pixels ratio.
     *
     * @returns The game's difficulty.
     */
    private getDifficulty(): string {
        if (this.differencesCoords.length < ImageConstants.NbDifferencesMin || this.differencesCoords.length > ImageConstants.NbDifferencesMax)
            return 'invalide';
        return this.differencesCoords.reduce((acc, difference) => acc + difference.length, 0) /
            (ImageConstants.DefaultWidth * ImageConstants.DefaultHeight) <=
            ImageConstants.DifficultyPercentage && this.differencesCoords.length >= ImageConstants.NbDifferencesHardDifficulty
            ? 'difficile'
            : 'facile';
    }

    /**
     * Sets the height and width of the virtual canvases to the default image size (640px x 480px).
     */
    private setVirtualCanvasSize(): void {
        this.virtualCanvas1.width = ImageConstants.DefaultWidth;
        this.virtualCanvas1.height = ImageConstants.DefaultHeight;
        this.virtualCanvas2.width = ImageConstants.DefaultWidth;
        this.virtualCanvas2.height = ImageConstants.DefaultHeight;
    }
}
