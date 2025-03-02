import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CompareService } from '@app/services/compare.service';
@Component({
    selector: 'app-compare-popup',
    templateUrl: './compare-popup.component.html',
    styleUrls: ['./compare-popup.component.scss'],
})
export class ComparePopupComponent implements AfterViewInit, OnInit {
    @ViewChild('content', { static: true }) content: ElementRef;

    displayedMessage: string;
    difficulty: string;
    private title: string;

    /**
     * @param data canvas element
     * @param compareService the service to detect the differences between the canvases.
     * @param dialogRef to open a dialog pop-up that displays the differences canvas.
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { canvas: HTMLCanvasElement },
        private compareService: CompareService,
        private dialogRef: MatDialogRef<ComparePopupComponent>,
    ) {
        this.title = '';
        this.difficulty = '';
        this.displayedMessage = '';
    }

    /**
     * Validates the differences between the two canvases.
     * Called when the pop-up component is initialized.
     */
    ngOnInit(): void {
        this.onValidate();
    }

    /**
     * Adds the canvas element to the DOM to show the differences between the canvases.
     * Called after the pop-up component is initialized.
     */
    ngAfterViewInit(): void {
        this.content.nativeElement.appendChild(this.data.canvas);
    }

    /**
     * Validates the differences between the two canvases.
     * Changes the message to be displayed on the pop-up if the number of differences is invalid.
     * Called when the user clicks on the comparison button.
     */
    onValidate(): void {
        const { difficulty, nbDifferences } = this.compareService.validateDifferences();
        this.difficulty = difficulty;

        this.displayedMessage =
            this.difficulty === 'invalide'
                ? `Erreur : nombre de différences invalide (${nbDifferences} trouvée` +
                  (nbDifferences <= 1 ? '' : 's') +
                  ', veuillez en générer entre 3 et 9).'
                : 'Niveau : ' + this.difficulty + ' avec ' + nbDifferences + ' différences.';
    }

    /**
     * Creates a new game with the given title and difficulty and sends it to the server.
     * If the title already exists, an error message is displayed.
     * Called when the user clicks on the confirmation button.
     */
    onSubmit(): void {
        this.compareService.createGame(this.title, this.difficulty).subscribe((exists) => {
            if (!exists) this.dialogRef.close(true);
            else this.displayedMessage = 'Erreur: ce titre existe déjà.';
        });
    }

    /**
     * Updates the title of the game.
     * Called when the user types in the input field.
     *
     * @param input the input field
     */
    onInput(input: HTMLInputElement, submitButton: HTMLButtonElement): void {
        const prohibitedChars: string[] = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
        let isValidInput = false;
        this.title = input.value;
        if (this.title.length > 0) isValidInput = true;

        for (const char of prohibitedChars) {
            if (this.title.includes(char)) {
                isValidInput = false;
            }
        }
        submitButton.disabled = !isValidInput;
    }
}
