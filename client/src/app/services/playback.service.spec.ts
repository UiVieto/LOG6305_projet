import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { TestLayersHelper } from '@app/classes/test-layers-helper';
import { EndReplayComponent } from '@app/components/end-replay/end-replay.component';
import { MessageComponent } from '@app/components/message/message.component';
import { PlaybackConstants, TestingValues } from '@app/constants/constants';
import { GameType } from '@common/game-instance';
import { Pixel } from '@common/pixel';
import { CounterService } from './counter.service';
import { GameFeedbackService } from './game-feedback.service';
import { GameSocketService } from './game-socket.service';
import { PlaybackService } from './playback.service';
import { SaveReplayService } from './save-replay.service';

describe('PlaybackService', () => {
    let service: PlaybackService;
    let feedbackService: GameFeedbackService;
    let gameSocketService: GameSocketService;
    let saveReplayService: SaveReplayService;
    let counterService: CounterService;

    let leftLayersStub: {
        image: jasmine.SpyObj<CanvasRenderingContext2D>;
        diff: jasmine.SpyObj<CanvasRenderingContext2D>;
        clue: jasmine.SpyObj<CanvasRenderingContext2D>;
    };

    let rightLayersStub: {
        image: jasmine.SpyObj<CanvasRenderingContext2D>;
        diff: jasmine.SpyObj<CanvasRenderingContext2D>;
        clue: jasmine.SpyObj<CanvasRenderingContext2D>;
    };

    beforeEach(() => {
        leftLayersStub = TestLayersHelper.createLayers(true);
        rightLayersStub = TestLayersHelper.createLayers(false);
        TestBed.configureTestingModule({
            imports: [MatDialogModule, RouterTestingModule, HttpClientTestingModule],
        });
        counterService = TestBed.inject(CounterService);
        saveReplayService = TestBed.inject(SaveReplayService);
        feedbackService = TestBed.inject(GameFeedbackService);
        gameSocketService = TestBed.inject(GameSocketService);
        service = TestBed.inject(PlaybackService);
    });

    beforeEach(() => {
        leftLayersStub.image.getImageData.and.returnValue(new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1));
        rightLayersStub.image.getImageData.and.returnValue(new ImageData(new Uint8ClampedArray([1, 1, 1, 1]), 1));
        feedbackService.initData(leftLayersStub, rightLayersStub);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('startPlayback', () => {
        service['incrementTime'] = jasmine.createSpy('increment');
        gameSocketService.setErrorDelay = jasmine.createSpy('setErrorDelay');
        gameSocketService.startReplay = jasmine.createSpy('startReplay');
        feedbackService.clearTimeouts = jasmine.createSpy('clearTimeouts');
        feedbackService.clearClueCanvas = jasmine.createSpy('clearClueCanvas');
        feedbackService.setFlickerSpeed = jasmine.createSpy('setFlickerSpeed');
        feedbackService.toggleCheat = jasmine.createSpy('toggleCheat');
        counterService.differenceCounter.next = jasmine.createSpy('next').and.callFake(() => {
            return 0;
        });
        service.counters.set('user', counterService);
        service.counters.get = jasmine.createSpy('get').and.returnValue(counterService);

        gameSocketService.gameInstance = {
            title: 'test',
            isHard: false,
            nbDiff: 3,
            players: ['user'],
            gameMode: GameType.Classic,
            hintPenalty: 0,
        };
        saveReplayService['playbackMap'] = new Map();
        feedbackService.isCheating = true;
        feedbackService.nbClues = 0;
        service.startPlayback();
        expect(counterService.differenceCounter.next).toHaveBeenCalled();
        expect(counterService.count).toEqual(0);
        expect(feedbackService.clearTimeouts).toHaveBeenCalled();
        expect(service.isPlaybackActive).toBeTruthy();
        expect(feedbackService.nbClues).toEqual(3);
        expect(feedbackService.clearClueCanvas).toHaveBeenCalled();
        expect(feedbackService.setFlickerSpeed).toHaveBeenCalled();
        expect(service['playbackSpeed']).toEqual(1);
        expect(gameSocketService.setErrorDelay).toHaveBeenCalled();
        expect(gameSocketService.startReplay).toHaveBeenCalled();
        expect(service['playbackIterator']).toEqual(saveReplayService.playback.keys());
        expect(service['isPlaying']).toBeTruthy();
        expect(feedbackService.toggleCheat).toHaveBeenCalled();
    });

    it('stopPlayback', () => {
        service['incrementTime'] = jasmine.createSpy('increment');
        service['dialog'].open = jasmine.createSpy('open');
        service.stopPlayback(true);
        expect(service['currentTime']).toEqual(0);
        expect(service['isPlaying']).toEqual(false);
        expect(service['dialog'].open).toHaveBeenCalledWith(EndReplayComponent, {
            width: '30%',
            panelClass: 'container',
            disableClose: true,
            autoFocus: false,
        });
    });

    it('stopPlayback return', () => {
        service['incrementTime'] = jasmine.createSpy('increment');
        service['dialog'].open = jasmine.createSpy('open');
        service.stopPlayback(false);
        expect(service['currentTime']).toEqual(0);
        expect(service['isPlaying']).toEqual(false);
        expect(service['dialog'].open).not.toHaveBeenCalled();
    });

    it('resumePlayback', () => {
        const dummy = document.createElement('canvas');
        dummy.classList.add('shake');
        feedbackService['rightLayers'].clue = dummy.getContext('2d') as CanvasRenderingContext2D;
        feedbackService['leftLayers'].clue = dummy.getContext('2d') as CanvasRenderingContext2D;

        service['incrementTime'] = jasmine.createSpy('increment');
        service['isThirdHintPaused'] = true;
        service['dialog'].open = jasmine.createSpy('open');
        service.resumePlayback();

        expect(service['currentTime']).toEqual(0);
        expect(service['isPlaying']).toEqual(true);
        expect(service['isThirdHintPaused']).toEqual(false);
    });

    it('pausePlayback', () => {
        const dummy = document.createElement('canvas');
        dummy.classList.add('shake');
        feedbackService['rightLayers'].clue = dummy.getContext('2d') as CanvasRenderingContext2D;
        feedbackService['leftLayers'].clue = dummy.getContext('2d') as CanvasRenderingContext2D;

        service.pausePlayback();

        expect(feedbackService['rightLayers'].clue.canvas.classList).not.toContain('shake');
        expect(feedbackService['leftLayers'].clue.canvas.classList).not.toContain('shake');
        expect(service['isPlaying']).toEqual(false);
        expect(service['isThirdHintPaused']).toEqual(true);
    });

    it('setPlaybackSpeed', () => {
        service.setPlaybackSpeed(TestingValues.FlickerSpeed);
        expect(service['playbackSpeed']).toEqual(TestingValues.FlickerSpeed);
    });

    it('clearPlayback', () => {
        const newMap = new Map<number, { eventType: 'time'; eventData: 0 }>();
        newMap.set(0, { eventType: 'time', eventData: 0 });
        service.counters.clear = jasmine.createSpy('clearCounters');
        service.clearPlayback();
        expect(saveReplayService['playbackMap']).toEqual(newMap);
    });

    it('incrementTime', () => {
        const newMap = new Map<number, { eventType: 'time'; eventData: 0 }>();
        newMap.set(0, { eventType: 'time', eventData: 0 });
        service.stopPlayback = jasmine.createSpy('stopPlayback');
        service['handleGameEvent'] = jasmine.createSpy('handleGameEvent');
        service['playbackIterator'] = newMap.keys();
        service['playbackIterator'].next = jasmine.createSpy('playbackIterator').and.callFake(() => {
            return 0;
        });
        service['currentTime'] = TestingValues.LowLimitTest1;
        service['nextEventTime'] = TestingValues.LowLimitTest1;
        service['playbackSpeed'] = TestingValues.LowLimitTest1;
        service['incrementTime']();
        expect(service['handleGameEvent']).toHaveBeenCalledTimes(1);
        expect(service['currentTime']).toEqual(service['playbackSpeed'] * PlaybackConstants.RefreshSpeed + TestingValues.LowLimitTest1);
        service['nextEventTime'] = undefined as unknown as number;
        service['incrementTime']();
        expect(service.stopPlayback).toHaveBeenCalledWith(true);
    });

    it('handleGameEvent : serverMessage', () => {
        const event = { eventType: 'serverMessage', eventData: { message: { sender: 'user', text: 'hello world' }, color: '', date: '' } };
        gameSocketService.handleServerMessage = jasmine.createSpy('handleGameEvent');
        service['handleGameEvent'](event);
        expect(gameSocketService.handleServerMessage).toHaveBeenCalledWith(
            (event.eventData as MessageComponent).message.text,
            true,
            event.eventData as MessageComponent,
        );
    });

    it('handleGameEvent : chatMessageSent', () => {
        const event = { eventType: 'chatMessageSent', eventData: { message: { sender: 'user', text: 'hello world' }, color: '', date: '' } };
        gameSocketService.handleChatMessageSent = jasmine.createSpy('handleChatSentEvent');
        service['handleGameEvent'](event);
        expect(gameSocketService.handleChatMessageSent).toHaveBeenCalledWith(
            (event.eventData as MessageComponent).message.text,
            true,
            event.eventData as MessageComponent,
        );
    });

    it('handleGameEvent : chatMessageReceived', () => {
        const event = { eventType: 'chatMessageReceived', eventData: { message: { sender: 'user', text: 'hello world' }, color: '', date: '' } };
        gameSocketService.handleChatMessageReceived = jasmine.createSpy('handleChatReceivedEvent');
        service['handleGameEvent'](event);
        expect(gameSocketService.handleChatMessageReceived).toHaveBeenCalledWith(
            (event.eventData as MessageComponent).message,
            true,
            event.eventData as MessageComponent,
        );
    });

    it('handleGameEvent : time', () => {
        const event = { eventType: 'time', eventData: 0 };
        gameSocketService.handleGameTimeUpdated = jasmine.createSpy('gameTimeUpdatedEvent');
        service['handleGameEvent'](event);
        expect(gameSocketService.handleGameTimeUpdated).toHaveBeenCalledWith(event.eventData as number, true);
    });

    it('handleGameEvent : error', () => {
        const event = { eventType: 'error', eventData: { x: 0, y: 0 } };
        gameSocketService.handleErrorClick = jasmine.createSpy('handleError');
        service['handleGameEvent'](event);
        expect(gameSocketService.handleErrorClick).toHaveBeenCalledWith(event.eventData as Pixel, true);
    });

    it('handleGameEvent : difference', () => {
        const event = { eventType: 'difference', eventData: { playerName: 'user', difference: [] } };
        counterService.handleWithoutSave = jasmine.createSpy('handleWithoutSave');
        service.counters.get = jasmine.createSpy('get').and.returnValue(counterService);
        service['handleGameEvent'](event);
        expect(counterService.handleWithoutSave).toHaveBeenCalledWith(event.eventData.difference);
    });

    it('handleGameEvent : cheating', () => {
        const event = { eventType: 'cheating', eventData: { playerName: 'user', difference: [] } };
        feedbackService.toggleCheat = jasmine.createSpy('toggleCheat');
        service['handleGameEvent'](event);
        expect(feedbackService.toggleCheat).toHaveBeenCalled();
    });

    it('handleGameEvent : clue', () => {
        service['currentTime'] = 0;
        gameSocketService.gameInstance = {
            title: 'test',
            isHard: false,
            nbDiff: 3,
            players: ['user'],
            gameMode: GameType.Classic,
            hintPenalty: 0,
        };
        const event = { eventType: 'clue', eventData: [{ x: 0, y: 0 }] };
        feedbackService.useClue = jasmine.createSpy('useClue');
        service['handleGameEvent'](event);
        expect(feedbackService.useClue).toHaveBeenCalledWith(event.eventData as Pixel[]);
        expect(service['currentTime']).toEqual(0);
    });
});
