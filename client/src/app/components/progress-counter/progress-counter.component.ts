import { Component, OnInit } from '@angular/core';
import { GameSocketService } from '@app/services/game-socket.service';
import { ProgressCounterService } from '@app/services/progress-counter.service';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-progress-counter',
    templateUrl: './progress-counter.component.html',
    styleUrls: ['./progress-counter.component.scss'],
})
export class ProgressCounterComponent implements OnInit {
    differencesFound: number;

    constructor(private progressCounterService: ProgressCounterService, public gameSocketService: GameSocketService) {}

    ngOnInit(): void {
        this.progressCounterService.differenceCounter = new BehaviorSubject(0);
        this.differencesFound = this.progressCounterService.differenceCounter.getValue();
        this.progressCounterService.differenceCounter.subscribe((count) => {
            this.differencesFound = count;
        });
    }
}
