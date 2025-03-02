import { Overlay } from '@angular/cdk/overlay';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChildrenOutletContexts, UrlSerializer } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Socket } from 'socket.io-client';
import { GameSocketService } from './game-socket.service';
import { SocketClientService } from './socket-client.service';

import { VsOptionService } from './vs-option.service';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('VsOptionService', () => {
    let service: VsOptionService;
    let socketServiceMock: SocketClientServiceMock;
    let socketTestHelper: SocketTestHelper;
    let gameSocketService: GameSocketService;
    beforeEach(() => {
        socketTestHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketTestHelper as unknown as Socket;

        TestBed.configureTestingModule({
            imports: [RouterTestingModule, MatDialogModule],
            providers: [
                UrlSerializer,
                ChildrenOutletContexts,
                HttpClient,
                HttpHandler,
                MatDialog,
                Overlay,
                { provide: SocketClientService, useValue: socketServiceMock },
            ],
        });
        gameSocketService = TestBed.inject(GameSocketService);
        service = TestBed.inject(VsOptionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should handle joining a waitingroom', fakeAsync(() => {
        service.joinFunction = jasmine.createSpy('join');
        spyOn(gameSocketService.socketService, 'on');
        const title = 'room1';
        service.init(title);
        socketTestHelper.peerSideEmit(`joinWaitingRoom${title}`);
        tick();
        expect(gameSocketService.socketService.on).toHaveBeenCalled();
    }));

    it('should change option to Rejoindre', () => {
        spyOn(service.option, 'next');
        service.toggleJoin();
        expect(service.option.next).toHaveBeenCalledWith('Rejoindre');
    });

    it('should change option to Créer', () => {
        spyOn(service.option, 'next');
        service.toggleCreate();
        expect(service.option.next).toHaveBeenCalledWith('Créer');
    });

    it('should destroy', () => {
        service.joinFunction = jasmine.createSpy('join');
        service.leaveFunction = jasmine.createSpy('leave');
        gameSocketService.socketService.socket.off = jasmine.createSpy('off');
        service.destroy('title');
        expect(gameSocketService.socketService.socket.off).toHaveBeenCalledTimes(2);
    });
});
