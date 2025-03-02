import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-limited-time-popup',
    templateUrl: './limited-time-popup.component.html',
    styleUrls: ['./limited-time-popup.component.scss'],
})
export class LimitedTimePopupComponent {
    username: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: string, private dialogRef: MatDialogRef<LimitedTimePopupComponent>) {
        this.username = '';
    }

    onInput(input: HTMLInputElement) {
        this.username = input.value;
    }

    onSubmit(mode: string) {
        this.dialogRef.close({ username: this.username, mode });
    }
}
