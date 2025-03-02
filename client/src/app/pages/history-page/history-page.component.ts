import { Component } from '@angular/core';
import { SheetContainerService } from '@app/services/sheet-container.service';

@Component({
    selector: 'app-history-page',
    templateUrl: './history-page.component.html',
    styleUrls: ['./history-page.component.scss'],
})
export class HistoryPageComponent {
    title: string;
    constructor(public sheetContainer: SheetContainerService) {
        this.title = 'Historique des parties';
    }
}
