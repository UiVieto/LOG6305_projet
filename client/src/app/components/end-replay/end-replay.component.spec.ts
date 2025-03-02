import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { EndReplayComponent } from './end-replay.component';
import { PlaybackService } from '@app/services/playback.service';
import { Router } from '@angular/router';

describe('EndReplayComponent', () => {
    let component: EndReplayComponent;
    let fixture: ComponentFixture<EndReplayComponent>;
    let playback: PlaybackService;
    let routerSpy: Router;
    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        await TestBed.configureTestingModule({
            declarations: [EndReplayComponent],
            imports: [MatDialogModule, RouterTestingModule, HttpClientTestingModule],
            providers: [{ provide: Router, useValue: routerSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(EndReplayComponent);
        component = fixture.componentInstance;
        playback = TestBed.inject(PlaybackService);
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
        component.quitPlayback();
        expect(playback.clearPlayback).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/home']);
    });
});
