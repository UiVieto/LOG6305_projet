import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ToolbarComponent } from '@app/components/creation-page/toolbar/toolbar.component';
import { CanvasManagerService } from '@app/services/canvas-manager.service';

@Component({
    selector: 'app-vertical-toolbar',
    templateUrl: './vertical-toolbar.component.html',
    styleUrls: ['./vertical-toolbar.component.scss'],
})
export class VerticalToolbarComponent {
    @ViewChild('verticalToolbar', { read: ElementRef }) verticalToolbar: ElementRef;

    @Input() toolbarRef: ToolbarComponent;

    constructor(private canvasManagerService: CanvasManagerService) {}

    /**
     * Calls the swapOverlays method of the draw service.
     * This method swaps the second layer of the left canvas with the second layer of the right canvas.
     * This method is called when the swap button is clicked.
     */
    swapOverlays(): void {
        this.canvasManagerService.swapOverlays();
    }

    /**
     * Calls the duplicate method of the draw service.
     * This method duplicates the second layer of the left canvas or the right canvas to the other side.
     * This method is called when the duplicate button is clicked.
     * The value of the parameter is either "toLeft" or "toRight".
     *
     * @param destination The side to which the second layer of the other canvas will be copied.
     */
    duplicate(destination: string): void {
        this.canvasManagerService.duplicate(destination);
    }
}
