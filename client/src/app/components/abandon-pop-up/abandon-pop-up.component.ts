import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlaybackService } from '@app/services/playback.service';

@Component({
    selector: 'app-abandon-pop-up',
    templateUrl: './abandon-pop-up.component.html',
    styleUrls: ['./abandon-pop-up.component.scss'],
})
export class AbandonPopUpComponent {
    constructor(private playback: PlaybackService, private router: Router) {}

    quit(): void {
        this.playback.clearPlayback();
        this.router.navigate(['/home']);
    }
}
