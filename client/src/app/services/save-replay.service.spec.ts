import { TestBed } from '@angular/core/testing';

import { SaveReplayService } from './save-replay.service';
import { TestingValues } from '@app/constants/constants';

describe('SaveReplayService', () => {
    let service: SaveReplayService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SaveReplayService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return playbackMap on get playback', () => {
        const playbackMap = new Map<number, { eventType: string; eventData: unknown }>();
        playbackMap.set(TestingValues.LowLimitTest1, { eventType: 'time', eventData: 23 });

        service['playbackMap'] = playbackMap;

        expect(service.playback).toEqual(playbackMap);
    });
});
