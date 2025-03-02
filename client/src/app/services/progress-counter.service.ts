import { Injectable } from '@angular/core';
import { GameInstance } from '@common/game-instance';
import { BehaviorSubject } from 'rxjs';
import { GameFeedbackService } from './game-feedback.service';
import { GameSocketService } from './game-socket.service';

@Injectable({
    providedIn: 'root',
})
export class ProgressCounterService {
    differenceCounter: BehaviorSubject<number>;

    constructor(private gameSocketService: GameSocketService, private feedbackService: GameFeedbackService) {
        this.differenceCounter = new BehaviorSubject(0);
        this.gameSocketService.socketService.on(
            'differenceFound',
            (files: { image1: ArrayBuffer; image2: ArrayBuffer; gameData: GameInstance } | undefined) => {
                if (files) {
                    gameSocketService.image1 = URL.createObjectURL(new Blob([files.image1]));
                    gameSocketService.image2 = URL.createObjectURL(new Blob([files.image2]));
                    gameSocketService.gameInstance = files.gameData;
                    this.gameSocketService.playFeedbackSound(true);
                    this.feedbackService.synchronizeNewSheet();
                }
                this.differenceCounter.next(this.differenceCounter.getValue() + 1);
            },
        );

        this.gameSocketService.socketService.on('playerLeft', (remainingPlayers: string[]) => {
            gameSocketService.gameInstance.players = remainingPlayers;
        });
    }
}
