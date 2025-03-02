import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EndReplayComponent } from '@app/components/end-replay/end-replay.component';
import { MessageComponent } from '@app/components/message/message.component';
import { PlaybackConstants, Time } from '@app/constants/constants';
import { Pixel } from '@common/pixel';
import { Subject } from 'rxjs';
import { CounterService } from './counter.service';
import { GameFeedbackService } from './game-feedback.service';
import { GameSocketService } from './game-socket.service';
import { SaveReplayService } from './save-replay.service';

@Injectable({
    providedIn: 'root',
})
export class PlaybackService {
    isPlaybackActive: boolean;
    playbackSpeedSubject: Subject<number>;
    counters: Map<string, CounterService>;

    private isPlaying: boolean;
    private playbackInterval: ReturnType<typeof setInterval>;
    private playbackIterator: IterableIterator<number>;
    private nextEventTime: number;
    private currentTime: number;
    private playbackSpeed: number;
    private isThirdHintPaused: boolean;

    /**
     * Constructor of the playback service class
     *
     * @param dialog to open the end replay dialog
     * @param saveReplay to get the replay data
     * @param gameSocketService to send the replay data to the server and execute the events
     * @param counterService to update the differences counter when a difference is found
     * @param gameFeedbackService to enable cheat mode when the user toggles it
     * ESLint's max-params rule is disabled because the constructor has 5 parameters that are all required for the service to work properly
     */
    // The max-params rule is disabled because the class needs all of these services to work properly.
    // eslint-disable-next-line max-params
    constructor(
        private dialog: MatDialog,
        private saveReplay: SaveReplayService,
        private gameSocketService: GameSocketService,
        private gameFeedbackService: GameFeedbackService,
    ) {
        // Set the class attributes to their initial value. Default spees is X1.
        this.isPlaying = false;
        this.currentTime = 0;
        this.playbackSpeed = 1;
        this.playbackSpeedSubject = new Subject<number>();
        this.counters = new Map<string, CounterService>();
        this.isThirdHintPaused = false;

        // To allow the game page components to know if the playback is active and display the content accordingly
        this.isPlaybackActive = false;
    }

    /**
     * Allows other classes to access the "isPlaying" attribute (used to toggle the play/pause button)
     *
     * @returns the value of the "isPlaying" attribute
     */
    get play(): boolean {
        return this.isPlaying;
    }

    /**
     * Starts the playback of the game by intializing the attributes and starting the interval
     */
    startPlayback(): void {
        if (this.gameFeedbackService.isCheating) this.gameFeedbackService.toggleCheat();
        this.gameFeedbackService.clearTimeouts();
        // Notify the front-end that the playback is active to update the display
        this.isPlaybackActive = true;
        // Reset the difference counters to 0
        this.counters.forEach((counter) => {
            counter.differenceCounter.next(0);
            counter.count = 0;
        });
        if (this.gameSocketService.gameInstance.players.length === 1) {
            this.gameFeedbackService.nbClues = 3;
            this.gameFeedbackService.clearClueCanvas();
        }
        // Reset the playback speed to its default value
        this.gameFeedbackService.setFlickerSpeed(1);
        this.gameSocketService.setErrorDelay(1);
        this.playbackSpeed = 1;
        this.playbackSpeedSubject.next(this.playbackSpeed);

        // Wipes the chat messages and the overlayed canvases to start the playback from the beginning
        this.gameSocketService.startReplay();

        // Create an iterator to iterate through the events in the playback map and find the first event time
        this.playbackIterator = this.saveReplay.playback.keys();
        this.nextEventTime = this.playbackIterator.next().value;

        // Start the interval to increment the time and execute the events.
        // The interval updates every 100ms, which allows for better performance than updating every 1ms but remains mostly accurate to the eye
        this.playbackInterval = setInterval(this.incrementTime, PlaybackConstants.RefreshSpeed);
        this.isPlaying = true;
    }

    /**
     * Stops the playback of the game by clearing the interval and resetting the attributes
     * Also opens a dialog to ask the user if they want to replay the game again or exit to the menu
     *
     * @param openPopUp true if the method should open the dialog, false otherwise
     */
    stopPlayback(openPopUp: boolean): void {
        // Reset the interval and the currentTime to 0 to allow for a new replay to start
        this.currentTime = 0;
        clearInterval(this.playbackInterval);
        this.isPlaying = false;

        // If the call has been triggered by the restart or quit buttons, we don't want to open the dialog
        if (!openPopUp) return;

        // Open a dialog to ask the user if they want to replay the game or exit to the menu
        this.dialog.open(EndReplayComponent, {
            width: '30%',
            panelClass: 'container',
            disableClose: true,
            autoFocus: false,
        });
    }

    /**
     * Starts playing the game from the point at which the user paused the playback
     * Called when the user clicks the "play" button of the playback toolbar
     */
    resumePlayback(): void {
        if (this.isThirdHintPaused) {
            this.gameFeedbackService.left.clue.canvas.classList.add('shake');
            this.gameFeedbackService.right.clue.canvas.classList.add('shake');
            this.isThirdHintPaused = false;
        }

        this.playbackInterval = setInterval(this.incrementTime, PlaybackConstants.RefreshSpeed);
        this.isPlaying = true;
    }

    /**
     * Pauses the playback of the game by clearing the interval but keeps the currentTime attribute intact
     * Called when the user clicks the "pause" button of the playback toolbar
     */
    pausePlayback(): void {
        if (
            this.gameFeedbackService.left.clue.canvas.classList.contains('shake') &&
            this.gameFeedbackService.right.clue.canvas.classList.contains('shake')
        ) {
            this.gameFeedbackService.left.clue.canvas.classList.remove('shake');
            this.gameFeedbackService.right.clue.canvas.classList.remove('shake');
            this.isThirdHintPaused = true;
        }

        clearInterval(this.playbackInterval);
        this.isPlaying = false;
    }

    /**
     * Sets the playback speed to the given value
     * Called when the user changes the playback speed in the playback toolbar
     *
     * @param speed the new playback speed
     */
    setPlaybackSpeed(speed: number): void {
        this.playbackSpeed = speed;
    }

    /**
     * Clears the playback map to allow for a new replay to be recorded
     * Adds a time event at time 0 to the playback map to allow for the next game to start
     * Called whenever the user exits the game page ; this prevents the user from replaying the game after he has left the page
     */
    clearPlayback(): void {
        this.saveReplay.playback.clear();
        this.counters.clear();
        this.saveReplay.playback.set(0, { eventType: 'time', eventData: 0 });
    }

    /**
     * Increments the currentTime attribute and executes the events that are due at that time
     * When the currentTime surpasses the next event time, the event is executed and the next event time is found
     * When we reach the end of the playback map, the playback is stopped
     * Called every 100ms by the interval
     */
    private incrementTime = () => {
        // Execute the events that are due at the current time and find the next event time
        if (this.currentTime >= this.nextEventTime) {
            this.handleGameEvent(this.saveReplay.playback.get(this.nextEventTime) as { eventType: string; eventData: unknown });
            this.nextEventTime = this.playbackIterator.next().value;
        }

        // Stop the playback when we reach the end of the playback map
        if (!this.nextEventTime) this.stopPlayback(true);

        // Increment the current time by 100 times the playback speed
        this.currentTime += this.playbackSpeed * PlaybackConstants.RefreshSpeed;
    };

    /**
     * Executes the given event by calling the appropriate method in the corresponding service
     * Called by the incrementTime method
     *
     * @param event the event to execute (contains the event type and the event data)
     * The event data varies from one event to another as not all events require the same information to be properly executed
     */
    private handleGameEvent(event: { eventType: string; eventData: unknown }): void {
        // isReplaying is set to true and passed to the handlers so they know that the event is being executed during a playback
        // This makes sure that the handlers do not save the data in the playback map again upon a replay
        const isReplaying = true;

        switch (event.eventType) {
            case 'serverMessage':
                this.gameSocketService.handleServerMessage(
                    (event.eventData as MessageComponent).message.text,
                    isReplaying,
                    event.eventData as MessageComponent,
                );
                break;

            case 'chatMessageSent':
                this.gameSocketService.handleChatMessageSent(
                    (event.eventData as MessageComponent).message.text,
                    isReplaying,
                    event.eventData as MessageComponent,
                );
                break;

            case 'chatMessageReceived':
                this.gameSocketService.handleChatMessageReceived(
                    (event.eventData as MessageComponent).message,
                    isReplaying,
                    event.eventData as MessageComponent,
                );
                break;

            case 'time':
                this.gameSocketService.handleGameTimeUpdated(event.eventData as number, isReplaying);
                break;

            case 'error':
                this.gameSocketService.handleErrorClick(event.eventData as Pixel, isReplaying);
                break;

            case 'difference': {
                const data = event.eventData as { playerName: string; difference: Pixel[] };
                (this.counters.get(data.playerName) as CounterService).handleWithoutSave(data.difference);
                break;
            }

            case 'cheating':
                this.gameFeedbackService.toggleCheat();
                break;

            case 'clue':
                this.gameFeedbackService.useClue(event.eventData as Pixel[]);
                this.currentTime += this.gameSocketService.gameInstance.hintPenalty * Time.SecToMs;
                break;
        }
    }
}
