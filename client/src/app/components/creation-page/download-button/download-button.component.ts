import { Component } from '@angular/core';
import { CompareService } from '@app/services/compare.service';

@Component({
    selector: 'app-download-button',
    templateUrl: './download-button.component.html',
    styleUrls: ['./download-button.component.scss'],
})
export class DownloadButtonComponent {
    private uploadMessage: string;

    /**
     * @param compareService the service to detect the differences between the canvases.
     */
    constructor(private compareService: CompareService) {
        this.uploadMessage = '';
    }

    /**
     * Draws the image on both canvases because the drawImage method is not given a canvas parameter.
     * If the image is not found, an error message is displayed.
     *
     * @param input the input element that contains the image.
     */
    async onInput(input: HTMLInputElement) {
        this.uploadMessage = input.files && input.files[0] ? await this.compareService.drawImage(input.files[0]) : 'Fichier introuvable';
        input.value = '';

        if (this.uploadMessage !== '') {
            alert(this.uploadMessage);
        }
    }
}
