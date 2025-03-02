import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GameSocketService } from '@app/services/game-socket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-username-pop-up',
    templateUrl: './username-pop-up.component.html',
    styleUrls: ['./username-pop-up.component.scss'],
})
export class UsernamePopUpComponent implements OnDestroy {
    username: string;
    prompt: string;
    private nameSubscription: Subscription;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: string,
        public gameSocketService: GameSocketService,
        public dialogRef: MatDialogRef<UsernamePopUpComponent>,
    ) {
        this.username = '';
        this.prompt = "Entrez un nom d'utilisateur";
        window.addEventListener('keydown', this.eventListener.bind(this));
    }

    onInput(input: HTMLInputElement, actionsContainer: HTMLDivElement) {
        this.username = input.value;
        actionsContainer.classList.toggle('show', this.username.length > 3);
    }

    ngOnDestroy(): void {
        if (this.nameSubscription) this.nameSubscription.unsubscribe();
        window.removeEventListener('keydown', this.eventListener.bind(this));
    }

    onSubmit() {
        if (this.data !== 'Jouer') {
            this.gameSocketService.validateUsername(this.username);
            this.nameSubscription = this.gameSocketService.isValidUsername.subscribe((isValid) => {
                if (isValid) this.dialogRef.close(this.username);
                else this.prompt = 'Ce nom est déjà utilisé';
            });
        } else this.dialogRef.close(this.username);
    }

    private eventListener(event: KeyboardEvent) {
        if (event.key === 'Enter') this.onSubmit();
    }
}
