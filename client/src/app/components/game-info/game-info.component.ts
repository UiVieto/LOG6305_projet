import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AbandonPopUpComponent } from '@app/components/abandon-pop-up/abandon-pop-up.component';

@Component({
    selector: 'app-game-info',
    templateUrl: './game-info.component.html',
    styleUrls: ['./game-info.component.scss'],
})
export class GameInfoComponent {
    constructor(private dialog: MatDialog) {}

    abandonGame() {
        this.dialog.open(AbandonPopUpComponent, {
            width: '30%',
            panelClass: 'container',
            autoFocus: false,
        });
    }
}
