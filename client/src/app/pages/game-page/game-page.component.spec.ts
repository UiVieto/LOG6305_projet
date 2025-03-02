// eslint-disable-next-line max-classes-per-file
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, Renderer2 } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BackgroundImageComponent } from '@app/components/background-image/background-image.component';
import { GameFeedbackService } from '@app/services/game-feedback.service';
import { GameSocketService } from '@app/services/game-socket.service';
import { GamePageComponent } from './game-page.component';

@Component({ selector: 'app-game', template: '' })
class GameStubComponent {}
@Component({ selector: 'app-game-info', template: '' })
class GameInfoStubComponent {}
@Component({ selector: 'app-chat', template: '' })
class ChatStubComponent {}

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let gameFeedbackServiceStub: jasmine.SpyObj<GameFeedbackService>;
    let gameSocketServiceStub: jasmine.SpyObj<GameSocketService>;

    beforeEach(() => {
        gameFeedbackServiceStub = jasmine.createSpyObj('GameFeedbackService', ['toggleCheat']);
        gameSocketServiceStub = jasmine.createSpyObj('GameSocketService', ['abandonGame', 'handleCheating']);

        TestBed.configureTestingModule({
            imports: [MatDialogModule, RouterTestingModule, HttpClientTestingModule],
            declarations: [GamePageComponent, BackgroundImageComponent, GameStubComponent, GameInfoStubComponent, ChatStubComponent],
            providers: [
                { provide: GameFeedbackService, useValue: gameFeedbackServiceStub },
                { provide: GameSocketService, useValue: gameSocketServiceStub },
                Renderer2,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
