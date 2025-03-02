import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-waiting-room-popup-component',
    templateUrl: './waiting-room-popup-component.component.html',
    styleUrls: ['./waiting-room-popup-component.component.scss'],
})
export class WaitingRoomPopupComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { gameTitle: string; prompt: string },
        public dialogRef: MatDialogRef<WaitingRoomPopupComponent>,
    ) {}
}
