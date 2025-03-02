import { Component, OnInit } from '@angular/core';
import { GameSocketService } from '@app/services/game-socket.service';
import { SheetContainerService } from '@app/services/sheet-container.service';
@Component({
    selector: 'app-game-selection',
    templateUrl: './game-selection.component.html',
    styleUrls: ['./game-selection.component.scss'],
})
export class SelectionPageComponent implements OnInit {
    title: string;

    constructor(public sheetContainer: SheetContainerService, public gameSocketService: GameSocketService) {
        this.title = 'Sélection de jeu';
    }

    ngOnInit(): void {
        this.sheetContainer.getSheets(0);
        this.gameSocketService.joinSelectionRoom();
    }
}
