import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LimitedTimePopupComponent } from '@app/components/limited-time-popup/limited-time-popup.component';
import { WaitingRoomPopupComponent } from '@app/components/waiting-room-popup-component/waiting-room-popup-component.component';
import { GameSocketService } from '@app/services/game-socket.service';
@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    readonly title: string;
    constructor(private dialog: MatDialog, private gameSocketService: GameSocketService) {
        this.title = 'Jeu des différences';
    }

    openLimitedTimePopup() {
        this.dialog
            .open(LimitedTimePopupComponent, { width: '30%', panelClass: 'container' })
            .afterClosed()
            .subscribe((data) => {
                if (data && data.username) {
                    this.gameSocketService.createGameLimitedTime(data.username, data.mode);
                    if (data.mode === 'Coop') {
                        this.dialog
                            .open(WaitingRoomPopupComponent, {
                                width: '20%',
                                data: { gameTitle: 'Mode temps limité', prompt: "En attente d'un joueur." },
                                disableClose: true,
                                panelClass: 'container',
                                autoFocus: false,
                            })
                            .afterClosed()
                            .subscribe(() => {
                                this.gameSocketService.socketService.send('cancelWaitingRoom');
                            });
                    }
                }
            });
    }
}
