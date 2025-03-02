import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { PlaybackOptionsComponent } from './playback-options.component';
import { PlaybackService } from '@app/services/playback.service';
import { Subject } from 'rxjs';
import { GameFeedbackService } from '@app/services/game-feedback.service';
import { GameSocketService } from '@app/services/game-socket.service';
import { Router } from '@angular/router';

describe('PlaybackOptionsComponent', () => {
    let component: PlaybackOptionsComponent;
    let fixture: ComponentFixture<PlaybackOptionsComponent>;
    let playbackService: PlaybackService;
    let feedbackService: GameFeedbackService;
    let gameSocketService: GameSocketService;
    let routerSpy: Router;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        await TestBed.configureTestingModule({
            declarations: [PlaybackOptionsComponent],
            imports: [MatDialogModule, RouterTestingModule, HttpClientTestingModule],
            providers: [{ provide: Router, useValue: routerSpy }],
        }).compileComponents();
        gameSocketService = TestBed.inject(GameSocketService);
        feedbackService = TestBed.inject(GameFeedbackService);
        playbackService = TestBed.inject(PlaybackService);
        fixture = TestBed.createComponent(PlaybackOptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create', () => {
        const playbackSubStub = new Subject<number>();
        playbackService.playbackSpeedSubject = playbackSubStub;
        spyOn(component, 'changePlaybackSpeed');
        component.ngOnInit();
        playbackSubStub.next(2);
        expect(component.changePlaybackSpeed).toHaveBeenCalled();
    });

    it('should togglePlay', () => {
        playbackService.pausePlayback = jasmine.createSpy('pausePlayback');
        playbackService.resumePlayback = jasmine.createSpy('resumePlayback');
        component.togglePlay();

        expect(playbackService.resumePlayback).toHaveBeenCalled();
        playbackService['isPlaying'] = true;
        component.togglePlay();
        expect(playbackService.pausePlayback).toHaveBeenCalled();
    });

    it('changePlaybackSpeed', () => {
        playbackService.setPlaybackSpeed = jasmine.createSpy('setPlaybackSpeed');
        feedbackService.setFlickerSpeed = jasmine.createSpy('setFlickerSpeed');
        gameSocketService.setErrorDelay = jasmine.createSpy('setErrorDelay');
        component['playbackSpeeds'].get = jasmine.createSpy('getPlaybackSpeeds');
        const div1 = document.createElement('div');
        const div2 = document.createElement('div');
        const div3 = document.createElement('div');
        div1.classList.add('active');
        div2.classList.add('active');
        div3.classList.add('active');

        component['playbackSpeeds'] = new Map([
            [1, div1],
            [2, div2],
            [3, div3],
        ]);

        component.changePlaybackSpeed(3);
        expect(feedbackService.setFlickerSpeed).toHaveBeenCalledWith(3);
        expect(gameSocketService.setErrorDelay).toHaveBeenCalledWith(3);
        expect(playbackService.setPlaybackSpeed).toHaveBeenCalledWith(3);
    });

    it('should restartReplay', () => {
        feedbackService.isCheating = true;
        feedbackService.toggleCheat = jasmine.createSpy('toggleCheat');
        playbackService.stopPlayback = jasmine.createSpy('stopPlayback');
        playbackService.startPlayback = jasmine.createSpy('startPlayback');
        feedbackService.clearTimeouts = jasmine.createSpy('clearTimeouts');
        component.restartReplay();

        expect(playbackService.stopPlayback).toHaveBeenCalledWith(false);
        expect(feedbackService.toggleCheat).toHaveBeenCalled();
        expect(feedbackService.clearTimeouts).toHaveBeenCalled();
        expect(component.playPause.nativeElement.src).toContain('/assets/Images/pause.png');
    });

    it('should quitReplay', () => {
        playbackService.stopPlayback = jasmine.createSpy('stopPlayback');
        playbackService.clearPlayback = jasmine.createSpy('clearPlayback');
        feedbackService.clearTimeouts = jasmine.createSpy('clearTimeouts');

        component.quitReplay();

        expect(playbackService.stopPlayback).toHaveBeenCalledWith(false);
        expect(playbackService.clearPlayback).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
});
