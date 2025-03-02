import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, QueryList } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { Time } from '@app/constants/constants';
import { GameFeedbackService } from '@app/services/game-feedback.service';
import { GameSocketService } from '@app/services/game-socket.service';
import { GameType } from '@common/game-instance';
import { GameComponent } from './game.component';

describe('GameComponent', () => {
    let component: GameComponent;
    let fixture: ComponentFixture<GameComponent>;
    let gameSocketService: GameSocketService;
    let gameFeedbackService: GameFeedbackService;
    let playAreaMock: jasmine.SpyObj<PlayAreaComponent>;

    beforeEach(async () => {
        playAreaMock = jasmine.createSpyObj<PlayAreaComponent>('PlayAreaComponent', ['getLayers']);
        await TestBed.configureTestingModule({
            declarations: [GameComponent, PlayAreaComponent],
            imports: [MatDialogModule, HttpClientTestingModule, RouterTestingModule],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        gameSocketService = TestBed.inject(GameSocketService);
        gameSocketService.gameInstance = {
            title: 'test',
            isHard: false,
            nbDiff: 3,
            players: ['user'],
            gameMode: GameType.Classic,
            hintPenalty: 30,
        };
        gameFeedbackService = TestBed.inject(GameFeedbackService);
        fixture = TestBed.createComponent(GameComponent);
        component = fixture.componentInstance;
        component.playAreas = new QueryList<PlayAreaComponent>();
        component.playAreas.reset([playAreaMock, playAreaMock]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onClue should call requestClue', () => {
        gameFeedbackService.nbClues = 3;
        gameSocketService.requestClue = jasmine.createSpy('requestClue');
        component.onClue();
        expect(gameSocketService.requestClue).toHaveBeenCalled();
    });

    it('onClue should not call requestClue when no clues are left', () => {
        gameFeedbackService.nbClues = 0;
        gameSocketService.requestClue = jasmine.createSpy('requestClue');
        component.onClue();
        expect(gameSocketService.requestClue).not.toHaveBeenCalled();
    });

    it('ngAfterViewInit', fakeAsync(() => {
        gameFeedbackService.initData = jasmine.createSpy('initData');
        gameFeedbackService.setFlickerSpeed = jasmine.createSpy('setFlickerSpeed');
        component.ngAfterViewInit();
        tick(Time.SecToMs);
        expect(gameFeedbackService.setFlickerSpeed).toHaveBeenCalledWith(1);
        expect(gameFeedbackService.initData).toHaveBeenCalled();
    }));

    it('handle keyboard event should start cheat mode if key is "t"', () => {
        const event = new KeyboardEvent('keyup', { key: 't' });
        const toggleCheatSpy = spyOn(component.gameFeedbackService, 'toggleCheat');
        component.onKeyUp(event);
        expect(toggleCheatSpy).toHaveBeenCalled();
    });

    it('handle keyboard event should use clue if key is "i"', () => {
        const event = new KeyboardEvent('keyup', { key: 'i' });
        spyOn(component, 'onClue').and.callThrough();
        component.onKeyUp(event);
        expect(component.onClue).toHaveBeenCalled();
    });

    it('handle keyboard event should not start cheat mode if focus is on an input element', () => {
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();
        const event = new KeyboardEvent('keyup', { key: 't' });
        const toggleCheatSpy = spyOn(component.gameFeedbackService, 'toggleCheat');
        component.onKeyUp(event);
        expect(toggleCheatSpy).not.toHaveBeenCalled();
        input.blur();
    });
});
