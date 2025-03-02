import { Injectable } from '@angular/core';
import { Pixel } from '@common/pixel';
import { Subject } from 'rxjs';
import { GameSocketService } from './game-socket.service';

@Injectable({
    providedIn: 'root',
})
export class CounterService {
    differenceCounter: Subject<number>;
    count: number;

    private handleDifferenceFound: (difference: Pixel[]) => void;

    constructor(private gameSocketService: GameSocketService) {
        this.count = 0;
        this.differenceCounter = new Subject<number>();
    }

    init(playerName: string): void {
        this.handleDifferenceFound = ((difference: Pixel[]) => {
            this.handleWithoutSave(difference);
            this.gameSocketService.handleDifferenceFound(playerName, difference);
        }).bind(this);
        this.gameSocketService.socketService.on(`differenceFound${playerName}`, this.handleDifferenceFound);
    }

    handleWithoutSave(difference: Pixel[]): void {
        this.gameSocketService.playFeedbackSound(true);
        this.gameSocketService.gameFeedbackService.drawDifference(difference);
        this.differenceCounter.next(++this.count);
    }

    destroy(playerName: string) {
        this.gameSocketService.socketService.socket.off(`differenceFound${playerName}`, this.handleDifferenceFound);
    }
}
