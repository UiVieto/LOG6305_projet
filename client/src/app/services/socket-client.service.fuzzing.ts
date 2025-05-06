import { TestBed } from '@angular/core/testing';

import { fuzz, preset } from 'fuzzing';

import { SocketClientService } from './socket-client.service';

describe('SocketClientService Fuzzing', () => {
    let service: SocketClientService;

    beforeEach((done) => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketClientService);
        service.connect();
        setTimeout(done, 500);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('on', async () => {
        console.log('on');
        const errors = await fuzz(service.on.bind(service))
            .under(preset.string(), [() => {}])
            .errors();
        expect(errors.length).toEqual(0);
    });

    it('send', async () => {
        console.log('send');
        const errors = await fuzz(service.send.bind(service)).string().errors();
        expect(errors.length).toEqual(0);
    });
});
