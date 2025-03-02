import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Message } from '@common/message';

@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements AfterViewInit {
    @ViewChild('messageContainer', { read: ElementRef }) messageElement: ElementRef<HTMLDivElement>;
    @ViewChild('innerMessage', { read: ElementRef }) innerMessage: ElementRef<HTMLDivElement>;
    @Input() message: Message;
    @Input() color: string;
    @Input() date: string;

    ngAfterViewInit(): void {
        this.innerMessage.nativeElement.style.backgroundColor = this.color;
        if (this.color === '#F0F81E') {
            this.messageElement.nativeElement.classList.add('sent');
        }
    }
}
