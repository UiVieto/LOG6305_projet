import { Component } from '@angular/core';
import { Time } from '@app/constants/constants';
import { GameSocketService } from '@app/services/game-socket.service';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent {
    display: string;

    constructor(private gameSocketService: GameSocketService) {
        this.formatTime(this.gameSocketService.serverTimer.getValue());
        this.gameSocketService.serverTimer.subscribe((time) => {
            this.formatTime(time);
        });
    }

    private formatTime(timeFromServer: number) {
        const minutes = Math.floor(timeFromServer / Time.MinToMs);
        const seconds = Math.floor((timeFromServer % Time.MinToMs) / Time.SecToMs);
        this.display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
