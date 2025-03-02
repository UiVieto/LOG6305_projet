import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanvasManagerService } from '@app/services/canvas-manager.service';
import { CompareService } from '@app/services/compare.service';
import { DrawService } from '@app/services/draw.service';
import { HistoryService } from '@app/services/history.service';

@Component({
    selector: 'app-creation',
    templateUrl: './creation.component.html',
    styleUrls: ['./creation.component.scss'],
})
export class CreationComponent implements AfterViewInit {
    @ViewChild('canvas1', { read: ElementRef }) canvas1: ElementRef;
    @ViewChild('canvas2', { read: ElementRef }) canvas2: ElementRef;

    title: string;

    /**
     * Constructor of the CreationComponent class.
     * The max-params rule is disabled because the constructor has 5 necessary parameters that are all useful services.
     *
     * @param compareService Service used to compare the two canvases.
     * @param dialog Service used to open a dialog.
     * @param canvasManagerService Service used to manage the actions that apply to the two canvases simultaneously.
     * @param history Service used to undo and redo actions.
     * @param drawService Service used to draw on the canvases one at a time.
     */
    // The max-params rule is disabled because the class needs all of these services to work properly.
    // eslint-disable-next-line max-params
    constructor(
        public compareService: CompareService,
        public dialog: MatDialog,
        private canvasManagerService: CanvasManagerService,
        private drawService: DrawService,
        private historyService: HistoryService,
    ) {
        this.title = 'Créer un nouveau jeu';
    }

    /**
     * Initializes the comparison canvas and the contexts of the two canvases to compare.
     * Initializes the drawing service with every canvas layer required.
     * Triggers after the view is initialized.
     */
    ngAfterViewInit(): void {
        this.initializeCanvases();
        this.compareService.initContexts(
            this.canvas1.nativeElement.querySelector('canvas#layer-1').getContext('2d') as CanvasRenderingContext2D,
            this.canvas1.nativeElement.querySelector('canvas#layer-2').getContext('2d') as CanvasRenderingContext2D,
            this.canvas2.nativeElement.querySelector('canvas#layer-1').getContext('2d') as CanvasRenderingContext2D,
            this.canvas2.nativeElement.querySelector('canvas#layer-2').getContext('2d') as CanvasRenderingContext2D,
        );
        this.drawService.initContexts(this.canvas1.nativeElement, this.canvas2.nativeElement);
        this.historyService.initContexts(this.canvas1.nativeElement, this.canvas2.nativeElement);
        this.canvasManagerService.initContexts(this.canvas1.nativeElement, this.canvas2.nativeElement);
    }

    /**
     * Draws a white background on both canvases to enable the comparison on page load.
     * The initial image drawn remains removable, but the background will be re-drawn with white.
     */
    private initializeCanvases(): void {
        this.drawWhiteImage(this.canvas1.nativeElement.querySelector('canvas#layer-1'));
        this.drawWhiteImage(this.canvas2.nativeElement.querySelector('canvas#layer-1'));
    }

    /**
     * Fills the base layer canvas with a white rectangle on the canvas provided as argument.
     *
     * @param canvas the canvas on which the image will be drawn.
     */
    private drawWhiteImage(canvas: HTMLCanvasElement): void {
        const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;
        canvasContext.fillStyle = 'white';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    }
}
