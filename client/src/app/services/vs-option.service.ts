import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameSocketService } from './game-socket.service';

@Injectable({
    providedIn: 'root',
})
export class VsOptionService {
    option: Subject<string>;

    joinFunction: () => void;
    leaveFunction: () => void;

    constructor(private gameSocketService: GameSocketService) {
        this.option = new Subject<string>();
    }

    init(title: string) {
        this.joinFunction = this.toggleJoin.bind(this);
        this.leaveFunction = this.toggleCreate.bind(this);
        this.gameSocketService.socketService.on(`joinWaitingRoom${title}`, this.joinFunction);
        this.gameSocketService.socketService.on(`leaveWaitingRoom${title}`, this.leaveFunction);
    }

    destroy(title: string) {
        this.gameSocketService.socketService.socket.off(`joinWaitingRoom${title}`, this.joinFunction);
        this.gameSocketService.socketService.socket.off(`leaveWaitingRoom${title}`, this.leaveFunction);
    }

    toggleJoin() {
        this.option.next('Rejoindre');
    }

    toggleCreate() {
        this.option.next('Créer');
    }
}
