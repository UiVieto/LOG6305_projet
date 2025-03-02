import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CanvasManagerService } from '@app/services/canvas-manager.service';
import { CompareService } from '@app/services/compare.service';

@Component({
    selector: 'app-image-input',
    templateUrl: './image-input.component.html',
    styleUrls: ['./image-input.component.scss'],
})
export class ImageInputComponent {
    @Input() inputId: string;
    @ViewChild('canvas2', { read: ElementRef }) canvas: ElementRef;

    private uploadMessage: string;

    /**
     * @param canvasManagerService the service to manage the actions that apply to both canvases.
     * @param compareService the service to detect the differences between the canvases.
     */
    constructor(private canvasManagerService: CanvasManagerService, private compareService: CompareService) {
        this.uploadMessage = '';
    }

    /**
     * Draws the image on the bottom layer canvas of the current ImageInputComponent.
     * If the image is not found, an error message is displayed.
     *
     * @param input the input element that contains the image.
     * @param canvas the canvas element that will contain the image.
     */
    async onInput(input: HTMLInputElement, canvas: HTMLCanvasElement) {
        this.uploadMessage =
            input.files && input.files[0]
                ? await this.compareService.drawImage(input.files[0], canvas.getContext('2d') as CanvasRenderingContext2D)
                : 'Fichier introuvable';
        input.value = '';
        if (this.uploadMessage !== '') {
            alert(this.uploadMessage);
        }
    }

    /**
     * Clears the image on the canvas by filling it with a white background.
     * Called when the user clicks on the clear button (trash can icon).
     *
     * @param canvas the canvas element that contains the image to be cleared.
     */
    clearImage(canvas: HTMLCanvasElement): void {
        const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;
        canvasContext.fillStyle = 'white';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Resets the second layer of the canvas (the drawings).
     * Called when the user clicks on the reset button (loop icon on either side).
     */
    resetOverlay(): void {
        this.canvasManagerService.resetOverlay(this.canvas.nativeElement);
    }
}
