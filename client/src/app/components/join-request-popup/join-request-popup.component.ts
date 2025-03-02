import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlayingUser } from '@common/playing-user';

@Component({
    selector: 'app-join-request-popup',
    templateUrl: './join-request-popup.component.html',
    styleUrls: ['./join-request-popup.component.scss'],
})
export class JoinRequestPopupComponent {
    constructor(@Inject(MAT_DIALOG_DATA) public data: PlayingUser, public dialogRef: MatDialogRef<JoinRequestPopupComponent>) {}

    refuse() {
        this.dialogRef.close(false);
    }

    accept() {
        this.dialogRef.close(true);
    }
}
