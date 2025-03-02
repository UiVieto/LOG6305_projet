import { Component, EventEmitter, Output } from '@angular/core';
import { MessageComponent } from '@app/components/message/message.component';
import { GameSocketService } from '@app/services/game-socket.service';
import { PlaybackService } from '@app/services/playback.service';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
    @Output() userIsTyping;

    messages: MessageComponent[];
    message: string;

    constructor(public gameSocket: GameSocketService, public playbackService: PlaybackService) {
        this.userIsTyping = new EventEmitter<boolean>();
        this.messages = this.gameSocket.messages;
        this.message = '';
    }

    addMessage(text: string) {
        if (text.length === 0) return;
        this.gameSocket.handleChatMessageSent(text);
        this.message = '';
    }
}
