import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { Time } from '@app/constants/constants';
import { GameFeedbackService } from '@app/services/game-feedback.service';
import { GameSocketService } from '@app/services/game-socket.service';
import { PlaybackService } from '@app/services/playback.service';

@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
})
export class GameComponent implements AfterViewInit, OnDestroy {
    @ViewChildren(PlayAreaComponent) playAreas: QueryList<PlayAreaComponent>;
    @ViewChildren(HTMLImageElement) clues: QueryList<HTMLImageElement>;
    @ViewChild('clues', { read: ElementRef }) cluesContainer: ElementRef<HTMLButtonElement>;

    private boundOnKeyUp: (event: KeyboardEvent) => void;

    constructor(
        public gameFeedbackService: GameFeedbackService,
        public gameSocketService: GameSocketService,
        public playbackService: PlaybackService,
    ) {
        this.boundOnKeyUp = this.onKeyUp.bind(this);
        window.addEventListener('keyup', this.boundOnKeyUp);
    }

    async ngAfterViewInit() {
        setTimeout(() => {
            this.gameFeedbackService.initData(this.playAreas.first.getLayers(), this.playAreas.last.getLayers());
            this.gameFeedbackService.setFlickerSpeed(1);
        }, Time.Delay);
    }

    onClue() {
        if (this.gameFeedbackService.nbClues > 0) this.gameSocketService.requestClue();
    }

    onKeyUp(event: KeyboardEvent) {
        if (!(document.activeElement instanceof HTMLInputElement) && !this.playbackService.isPlaybackActive) {
            if (event.key === 't') {
                this.gameFeedbackService.toggleCheat();
                this.gameSocketService.handleCheating();
            } else if (event.key === 'i' && this.gameSocketService.gameInstance.players.length === 1) this.onClue();
        }
    }

    ngOnDestroy(): void {
        window.removeEventListener('keyup', this.boundOnKeyUp);
        this.gameSocketService.isOngoing = false;
        this.gameSocketService.abandonGame();
    }
}
