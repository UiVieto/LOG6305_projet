import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Tool } from '@app/classes/tool';
import { ComparePopupComponent } from '@app/components/creation-page/compare-popup/compare-popup.component';
import { ImageConstants } from '@app/constants/constants';
import { CompareService } from '@app/services/compare.service';
import { DrawService } from '@app/services/draw.service';
import { HistoryService } from '@app/services/history.service';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements AfterViewInit {
    @ViewChild('toolbar', { read: ElementRef }) toolbar: ElementRef;

    precision: number;
    private differencesCanvas;
    private iconContainers: Map<string, HTMLDivElement>;

    /**
     * Constructor for the Toolbar Component.
     * The max-params rule is disabled because the class requires every one of the services listed in the constructor.
     *
     * @param compareService Service used to compare the two canvases.
     * @param drawService Service used to draw on the canvases.
     * @param dialog Service used to open a dialog.
     * @param history Service used to undo and redo actions.
     * @param router Service used to navigate to another page.
     */
    // eslint-disable-next-line max-params
    constructor(
        private compareService: CompareService,
        private dialog: MatDialog,
        private drawService: DrawService,
        private historyService: HistoryService,
        private router: Router,
    ) {
        this.precision = 3;
        this.differencesCanvas = document.createElement('canvas');
    }

    /**
     * Triggers after the view is initialized.
     * Sets the dimensions of the comparison canvas to default values (640px x 480px).
     * Initializes the comparison canvas of the CompareService.
     */
    ngAfterViewInit(): void {
        this.differencesCanvas.width = ImageConstants.DefaultWidth;
        this.differencesCanvas.height = ImageConstants.DefaultHeight;
        this.compareService.initDifferencesCanvas(this.differencesCanvas.getContext('2d') as CanvasRenderingContext2D);

        this.iconContainers = new Map();
        ['pencil', 'rectangle', 'eraser'].forEach((tool) =>
            this.iconContainers.set(tool, this.toolbar.nativeElement.querySelector(`#${tool}`).parentElement),
        );
    }

    /**
     * Merges the first and second layers of the two canvases.
     * Draws the differences between the two canvases on the comparison canvas.
     * Opens a dialog to display the comparison canvas.
     */
    compare(): void {
        this.compareService.mergeCanvases();
        this.compareService.drawDifferences(this.precision);
        const dialogRef = this.dialog.open(ComparePopupComponent, { data: { canvas: this.differencesCanvas }, panelClass: 'container' });
        dialogRef.afterClosed().subscribe((result: boolean) => {
            if (result) this.router.navigate(['/config']);
        });
    }

    /**
     * Sets the precision value indicated by the slider to the new value given by the user.
     *
     * @param $event The new precision value.
     */
    onPrecisionChange($event: number): void {
        if ($event === null || this.precision === $event) return;
        else this.precision = $event;
    }

    /**
     * Enables or disables the tool given as parameter.
     * If the tool is enabled, the icon is highlighted.
     * If the tool is disabled, the icon is not highlighted.
     *
     * @param tool The tool to toggle.
     */
    toggleTool(tool: string): void {
        this.drawService.toggleTool(tool);
        this.iconContainers.forEach((container) => container.classList.remove('active'));
        this.iconContainers.get(this.drawService.tool)?.classList.add('active');
    }

    /**
     * Changes the color of the pencil in the draw service.
     * This method is called when the pencil color is changed by the user.
     *
     * @param changeEvent The event that is triggered when the pencil color is changed.
     * The value of the event target is the new color of the pencil.
     */
    changePencilColor(changeEvent: Event): void {
        Tool.drawColor = (changeEvent.target as HTMLSelectElement).value;
    }

    /**
     * Changes the width of the pencil in the draw service.
     * This method is called when the pencil width is changed by the user.
     *
     * @param changeEvent The event that is triggered when the pencil width is changed.
     * The value of the event target is the new width of the pencil.
     */
    changePencilWidth(changeEvent: Event): void {
        Tool.drawWidth = parseInt((changeEvent.target as HTMLSelectElement).value, 10);
    }

    /**
     * Changes the color of the rectangle in the draw service.
     * This method is called when the rectangle color is changed by the user.
     *
     * @param changeEvent The event that is triggered when the rectangle color is changed.
     * The value of the event target is the new color of the rectangle.
     */
    changeRectangleColor(changeEvent: Event): void {
        Tool.rectangleColor = (changeEvent.target as HTMLSelectElement).value;
    }

    /**
     * Changes the width of the eraser in the draw service.
     * This method is called when the eraser width is changed by the user.
     *
     * @param changeEvent The event that is triggered when the eraser width is changed.
     * The value of the event target is the new width of the eraser.
     */
    changeEraserWidth(changeEvent: Event): void {
        Tool.eraserWidth = parseInt((changeEvent.target as HTMLSelectElement).value, 10);
    }

    /**
     * Calls the undoAction method of the history service.
     * This method undoes the last action performed on either canvas.
     * This method is called when the undo button is clicked (back arrow icon in the toolbar).
     */
    undoAction(): void {
        this.historyService.undoAction();
    }

    /**
     * Calls the redoAction method of the history service.
     * This method redoes the last action performed on either canvas.
     * This method is called when the redo button is clicked (forward arrow in the toolbar).
     */
    redoAction(): void {
        this.historyService.redoAction();
    }
}
