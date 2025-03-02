import { Component, ElementRef, Input, OnChanges, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Time } from '@app/constants/constants';
import { SheetContainerService } from '@app/services/sheet-container.service';
import { GameArchive } from '@common/game-archive';

@Component({
    selector: 'app-history-list',
    templateUrl: './history-list.component.html',
    styleUrls: ['./history-list.component.scss'],
})
export class HistoryListComponent implements OnChanges, OnInit {
    @ViewChildren('username1', { read: ElementRef }) username1: QueryList<ElementRef>;
    @ViewChildren('username2', { read: ElementRef }) username2: QueryList<ElementRef>;
    @Input() currentHistory: GameArchive[];

    constructor(private sheetContainer: SheetContainerService) {
        this.username1 = new QueryList<ElementRef>();
        this.username2 = new QueryList<ElementRef>();
    }
    async ngOnInit(): Promise<void> {
        await this.sheetContainer.getHistory();
    }

    async ngOnChanges(): Promise<void> {
        for (let i = -1; i < this.currentHistory.length; ++i) {
            await this.filterResults(i);
        }
    }

    formatDate(date: number): string {
        const displayDate = new Date(date);
        return displayDate.toLocaleString('en-GB');
    }

    formatTime(time: number): string {
        const timeInSec = Math.floor(time / Time.SecToMs);
        const minutes = Math.floor(timeInSec / Time.MinToSec);
        const seconds = timeInSec % Time.MinToSec;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    private async filterResults(index: number) {
        const username1 = this.username1.get(index);
        const username2 = this.username2.get(index);
        if (username1 && username2) {
            if (!this.currentHistory[index].hasAbandoned) {
                if (this.currentHistory[index].gameMode === 'Classique') {
                    const user = this.currentHistory[index].isPlayer1 ? username1 : username2;
                    user.nativeElement.style.fontWeight = 'bold';
                } else {
                    if (this.currentHistory[index].endClock !== 0) {
                        username1.nativeElement.style.fontWeight = 'bold';
                        username2.nativeElement.style.fontWeight = 'bold';
                    }
                }
            } else {
                const user = this.currentHistory[index].isPlayer1 ? username1 : username2;
                user.nativeElement.style.textDecoration = 'line-through';
            }
        }
    }
}
