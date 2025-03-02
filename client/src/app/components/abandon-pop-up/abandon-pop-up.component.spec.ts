import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { GameSocketService } from '@app/services/game-socket.service';

import { Router } from '@angular/router';
import { PlaybackService } from '@app/services/playback.service';
import { GameType } from '@common/game-instance';
import { AbandonPopUpComponent } from './abandon-pop-up.component';

describe('AbandonPopUpComponent', () => {
    let component: AbandonPopUpComponent;
    let fixture: ComponentFixture<AbandonPopUpComponent>;
    let gameComsService: GameSocketService;
    let playbackService: PlaybackService;
    let routerSpy: Router;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        await TestBed.configureTestingModule({
            declarations: [AbandonPopUpComponent],
            imports: [MatDialogModule, HttpClientTestingModule, RouterTestingModule],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
                GameSocketService,
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(AbandonPopUpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        gameComsService = TestBed.inject(GameSocketService);
        playbackService = TestBed.inject(PlaybackService);

        gameComsService.gameInstance = {
            title: 'test',
            isHard: false,
            nbDiff: 0,
            players: ['user1', 'user2'],
            gameMode: GameType.Classic,
            hintPenalty: 30,
        };
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should quit and navigate on quit()', () => {
        playbackService.clearPlayback = jasmine.createSpy('clearPlayback');
        component.quit();
        expect(playbackService.clearPlayback).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
});
