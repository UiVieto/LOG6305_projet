import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameSocketService } from '@app/services/game-socket.service';
import { PlaybackService } from '@app/services/playback.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent {
    constructor(private gameSocketService: GameSocketService, public playbackService: PlaybackService, private router: Router) {
        if (!this.gameSocketService.isOngoing) this.router.navigate(['/home']);
    }
}
