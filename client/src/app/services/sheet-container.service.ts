import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Preview } from '@app/interfaces/preview';
import { CommunicationService } from '@app/services/communication.service';
import { GameArchive } from '@common/game-archive';
import { PageDetails, PreviewWithoutImage1 } from '@common/preview';

@Injectable({
    providedIn: 'root',
})
export class SheetContainerService {
    pageIndex: number;
    isLastPage: boolean;
    currentGames: Preview[];
    currentHistory: GameArchive[];

    constructor(private communicationService: CommunicationService, public dialog: MatDialog) {
        this.currentHistory = [];
    }

    async getSheets(pageIndex: number) {
        this.communicationService.getGames(pageIndex).subscribe((pageDetails: PageDetails) => {
            this.isLastPage = pageDetails.isLastPage;
            this.pageIndex = pageDetails.pageIndex;

            this.currentGames = [];
            pageDetails.games.forEach((game: PreviewWithoutImage1) => {
                this.currentGames.push({ ...game, image1: this.communicationService.getGameFile(game.title, true) });
            });
        });
    }

    async getHistory() {
        this.communicationService.getHistory().subscribe((history: GameArchive[]) => {
            this.currentHistory = [];
            history.forEach((gameHistory: GameArchive) => {
                this.currentHistory.push(gameHistory);
            });
        });
    }

    async deleteHistory() {
        if (confirm("Êtes-vous sûr de vouloir supprimer l'historique?")) {
            this.currentHistory = [];
            this.communicationService.deleteHistory().subscribe();
        }
    }

    nextIndex(): void {
        this.getSheets(++this.pageIndex);
    }

    previousIndex(): void {
        this.getSheets(--this.pageIndex);
    }

    deleteSheet(title: string): void {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette feuille?')) {
            this.currentGames = this.currentGames.filter((game) => game.title !== title);
            this.communicationService
                .deleteGame(title)
                .subscribe()
                .add(async () => await this.getSheets(this.pageIndex));
        }
    }

    deleteAllSheets() {
        if (confirm('Êtes-vous sûr de vouloir supprimer toutes les fiches?')) {
            this.currentGames = [];
            this.communicationService.deleteAllGames().subscribe();
        }
    }
}
