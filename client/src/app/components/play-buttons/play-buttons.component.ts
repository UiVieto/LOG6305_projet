import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UsernamePopUpComponent } from '@app/components/username-pop-up/username-pop-up.component';
import { GameSocketService } from '@app/services/game-socket.service';
import { VsOptionService } from '@app/services/vs-option.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-play-buttons',
    templateUrl: './play-buttons.component.html',
    styleUrls: ['./play-buttons.component.scss'],
    providers: [VsOptionService],
})
export class PlayButtonsComponent implements OnInit, OnDestroy {
    @Input() title: string;
    @Input() isInitiallyVsActive: boolean;
    buttonText: string;
    private dialogRef: MatDialogRef<UsernamePopUpComponent> | null;

    constructor(private dialog: MatDialog, private gameSocketService: GameSocketService, private vsOptionService: VsOptionService) {}

    ngOnInit(): void {
        this.vsOptionService.init(this.title);
        this.buttonText = this.isInitiallyVsActive ? 'Rejoindre' : 'Créer';
        this.vsOptionService.option.subscribe(this.changeDisplay);
    }

    ngOnDestroy(): void {
        this.vsOptionService.destroy(this.title);
    }

    startSolo() {
        this.openUsernamePopup('Jouer').subscribe((username) => {
            if (username) this.gameSocketService.createGameSolo({ gameTitle: this.title, username });
        });
    }

    startVs() {
        this.openUsernamePopup(this.buttonText).subscribe((username) => {
            if (username) this.gameSocketService.createGameVs({ gameTitle: this.title, username }, this.buttonText === 'Créer');
        });
    }

    private openUsernamePopup(option: string): Observable<string> {
        this.dialogRef = this.dialog.open(UsernamePopUpComponent, { width: '30%', data: option, panelClass: 'container' });
        this.dialogRef.afterClosed().subscribe(() => {
            this.dialogRef = null;
        });
        return this.dialogRef.afterClosed();
    }

    private changeDisplay = (newOption: string) => {
        this.buttonText = newOption;
        if (this.dialogRef) this.dialogRef.componentInstance.data = newOption;
    };
}
