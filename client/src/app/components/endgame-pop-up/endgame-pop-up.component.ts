import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GameSocketService } from '@app/services/game-socket.service';
import { PlaybackService } from '@app/services/playback.service';
import { GameType } from '@common/game-instance';

@Component({
    selector: 'app-endgame-pop-up',
    templateUrl: './endgame-pop-up.component.html',
    styleUrls: ['./endgame-pop-up.component.scss'],
})
export class EndgamePopUpComponent {
    isClassic: boolean;

    // MAT_DIALOG_DATA is needed to show appropriate end game message on win/loss
    // Router is needed to redirect to home page
    // PlaybackService is needed as the button for replay is required on the popup
    // GameSocketService tells the popup to allow replays for classic games
    // eslint-disable-next-line max-params
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { prompt: string; details: string },
        private playback: PlaybackService,
        private router: Router,
        private gameSocketService: GameSocketService,
    ) {
        this.isClassic = this.gameSocketService.gameInstance.gameMode === GameType.Classic;
    }

    startPlayback(): void {
        this.playback.startPlayback();
    }

    terminateGame(): void {
        this.playback.clearPlayback();
        this.router.navigate(['/home']);
    }
}
