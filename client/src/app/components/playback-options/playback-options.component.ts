import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GameFeedbackService } from '@app/services/game-feedback.service';
import { GameSocketService } from '@app/services/game-socket.service';
import { PlaybackService } from '@app/services/playback.service';

@Component({
    selector: 'app-playback-options',
    templateUrl: './playback-options.component.html',
    styleUrls: ['./playback-options.component.scss'],
})
export class PlaybackOptionsComponent implements AfterViewInit, OnInit {
    @ViewChild('speedOptions', { read: ElementRef }) speedOptions: ElementRef;
    @ViewChild('playPause', { read: ElementRef }) playPause: ElementRef;

    private playbackSpeeds: Map<number, HTMLDivElement>;

    /**
     * Constructor of the PlaybackOptionsComponent class.
     *
     * @param playback the service used to control the replay of the game
     * @param router used to navigate to the home page
     */
    // The max-params rule is disabled because the class needs all of these services to work properly.
    // eslint-disable-next-line max-params
    constructor(
        private playback: PlaybackService,
        private gameFeedback: GameFeedbackService,
        private router: Router,
        private gameSocketService: GameSocketService,
    ) {}

    /**
     * Subscribes to the playback speed subject to be notified when the playback speed changes.
     * This method is called when the component is initialized.
     */
    ngOnInit(): void {
        this.playback.playbackSpeedSubject.subscribe((speed: number) => {
            this.changePlaybackSpeed(speed);
        });
    }

    /**
     * Initializes the playback speed map with values 1, 2 and 4.
     * This method is called after the view has been initialized.
     */
    ngAfterViewInit(): void {
        // Creates a new map to store the playback speed icons.
        this.playbackSpeeds = new Map();

        // Initializes the playback speed map with values 1, 2 and 4.
        // The no-magic-numbers rule is disabled because the numbers are not arbitrary, rather they are the only acceptable values.
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        [1, 2, 4].forEach((speed) => this.playbackSpeeds.set(speed, this.speedOptions.nativeElement.querySelector(`#speed-${speed}`)));
    }

    /**
     * Toggles the playback of the replay when the user clicks on the play/pause button.
     * If the playback is currently paused, the playback is resumed.
     * If the playback is currently playing, the playback is paused.
     * The image of the button is also changed to reflect the current state of the playback.
     */
    togglePlay(): void {
        if (this.playback.play) {
            this.playback.pausePlayback();
            this.playPause.nativeElement.src = '/assets/Images/play.png';
        } else {
            this.playback.resumePlayback();
            this.playPause.nativeElement.src = '/assets/Images/pause.png';
        }
    }

    /**
     * Changes the playback speed when the user clicks on one of the speed icons (1X, 2X, 3X).
     * The speed is changed to the value of the icon that was clicked.
     * The icon that was clicked is highlighted to indicate that it is the current playback speed.
     *
     * @param speed the new playback speed (values 1, 2 and 4 are expected)
     */
    changePlaybackSpeed(speed: number): void {
        this.playback.setPlaybackSpeed(speed);
        this.gameFeedback.setFlickerSpeed(speed);
        this.gameSocketService.setErrorDelay(speed);
        this.playbackSpeeds.forEach((icon) => icon.classList.remove('active'));
        (this.playbackSpeeds.get(speed) as HTMLDivElement).classList.add('active');
    }

    /**
     * Restarts the replay from the beginning when the user clicks on the restart button.
     * This method also clears the timeouts that make the differences flicker to prevent a bug where the differences would continue flickering.
     */
    restartReplay(): void {
        if (this.gameFeedback.isCheating) this.gameFeedback.toggleCheat();
        this.gameFeedback.clearTimeouts();
        this.playback.stopPlayback(false);
        this.playback.startPlayback();
        this.playPause.nativeElement.src = '/assets/Images/pause.png';
    }

    /**
     * Stops the replay and returns to the home page when the user clicks on the quit button.
     * The playback is stopped and cleared to prevent the replay from playing again.
     * The user is then redirected to the home page.
     */
    quitReplay(): void {
        this.playback.stopPlayback(false);
        this.playback.isPlaybackActive = false;
        this.playback.clearPlayback();
        this.router.navigate(['/home']);
    }
}
