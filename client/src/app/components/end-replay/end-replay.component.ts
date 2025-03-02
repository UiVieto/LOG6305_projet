import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlaybackService } from '@app/services/playback.service';

@Component({
    selector: 'app-end-replay',
    templateUrl: './end-replay.component.html',
    styleUrls: ['./end-replay.component.scss'],
})
export class EndReplayComponent {
    /**
     * Constructor of the EndReplayComponent class.
     *
     * @param playback the service used to control the replay of the game
     * @param router used to navigate to the home page
     */
    constructor(private playback: PlaybackService, private router: Router) {}

    /**
     * Starts the replay when the user decides to play the replay again.
     * The playback is started from the beginning.
     */
    startPlayback(): void {
        this.playback.startPlayback();
    }

    /**
     * Stops the replay when the user decides to quit the game page.
     * The playback is cleared and the user is redirected to the home page.
     */
    quitPlayback(): void {
        this.playback.clearPlayback();
        this.playback.isPlaybackActive = false;
        this.router.navigate(['/home']);
    }
}
