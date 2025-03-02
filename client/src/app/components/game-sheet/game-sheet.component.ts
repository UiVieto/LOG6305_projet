import { Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Time } from '@app/constants/constants';
import { Preview } from '@app/interfaces/preview';

@Component({
    selector: 'app-game-sheet',
    templateUrl: './game-sheet.component.html',
    styleUrls: ['./game-sheet.component.scss'],
})
export class GameSheetComponent {
    @Input() sheetInput: Preview;

    constructor(private sanitizer: DomSanitizer) {}

    sanitize(url: string | null) {
        return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
    }

    formatTime(time: number): string {
        const minutes = Math.floor(time / Time.MinToSec);
        const seconds = time - minutes * Time.MinToSec;
        return minutes + ':' + (seconds < Time.SecToMs / Time.Delay ? '0' + seconds : seconds);
    }
}
