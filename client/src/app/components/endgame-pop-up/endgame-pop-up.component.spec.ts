import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UrlSerializer } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameSocketService } from '@app/services/game-socket.service';
import { PlaybackService } from '@app/services/playback.service';
import { GameType } from '@common/game-instance';
import { EndgamePopUpComponent } from './endgame-pop-up.component';

describe('EndgamePopUpComponent', () => {
    let component: EndgamePopUpComponent;
    let fixture: ComponentFixture<EndgamePopUpComponent>;
    let playback: PlaybackService;
    let gameSocketService: GameSocketService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EndgamePopUpComponent],
            imports: [MatDialogModule, RouterTestingModule, HttpClientTestingModule],
            providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }, { provide: MatDialogRef, useValue: {} }, UrlSerializer],
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
        fixture = TestBed.createComponent(EndgamePopUpComponent);
        playback = TestBed.inject(PlaybackService);

        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call playback startplayback', () => {
        playback.startPlayback = jasmine.createSpy();
        component.startPlayback();
        expect(playback.startPlayback).toHaveBeenCalled();
    });

    it('should call playback startplayback and navigate', () => {
        playback.clearPlayback = jasmine.createSpy();
        component.terminateGame();
        expect(playback.clearPlayback).toHaveBeenCalled();
    });
});
