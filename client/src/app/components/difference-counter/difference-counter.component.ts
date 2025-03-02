import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CounterService } from '@app/services/counter.service';
import { GameSocketService } from '@app/services/game-socket.service';
import { PlaybackService } from '@app/services/playback.service';

@Component({
    selector: 'app-difference-counter',
    templateUrl: './difference-counter.component.html',
    styleUrls: ['./difference-counter.component.scss'],
    providers: [CounterService],
})
export class DifferenceCounterComponent implements OnInit, OnDestroy {
    @Input() playerName: string;
    nbDifferences: number;
    differencesFound: number;

    constructor(public gameComs: GameSocketService, private counterService: CounterService, private playback: PlaybackService) {
        this.nbDifferences = Math.ceil(this.gameComs.gameInstance.nbDiff / this.gameComs.gameInstance.players.length);
        this.differencesFound = 0;
    }

    ngOnInit(): void {
        this.counterService.init(this.playerName);
        this.playback.counters.set(this.playerName, this.counterService);
        this.counterService.differenceCounter.subscribe((count) => {
            this.differencesFound = count;
        });
    }
    ngOnDestroy(): void {
        this.counterService.destroy(this.playerName);
    }
}
