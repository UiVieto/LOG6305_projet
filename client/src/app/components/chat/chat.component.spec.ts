import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { GameSocketService } from '@app/services/game-socket.service';

import { GameType } from '@common/game-instance';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let gameSocketServiceStub: jasmine.SpyObj<GameSocketService>;

    beforeEach(async () => {
        gameSocketServiceStub = jasmine.createSpyObj('GameSocketService', ['sendChatMessage']);
        await TestBed.configureTestingModule({
            declarations: [ChatComponent],
            imports: [MatDialogModule, HttpClientTestingModule, RouterTestingModule, FormsModule],
            providers: [{ provide: GameSocketService, useValue: gameSocketServiceStub }],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatComponent);
        gameSocketServiceStub.gameInstance = {
            title: 'stub',
            isHard: false,
            nbDiff: 5,
            players: ['stub'],
            gameMode: GameType.Classic,
            hintPenalty: 30,
        };
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should addMessage', () => {
        gameSocketServiceStub.handleChatMessageSent = jasmine.createSpy();
        component.addMessage('test');
        expect(gameSocketServiceStub.handleChatMessageSent).toHaveBeenCalledWith('test');
        expect(component.message).toEqual('');
    });

    it('should not addMessage', () => {
        gameSocketServiceStub.handleChatMessageSent = jasmine.createSpy();
        component.addMessage('');
        expect(gameSocketServiceStub.handleChatMessageSent).not.toHaveBeenCalled();
    });
});
