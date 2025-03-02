import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Pixel } from '@common/pixel';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { CounterService } from './counter.service';
import { GameSocketService } from './game-socket.service';
import { SocketClientService } from './socket-client.service';
class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('CounterService', () => {
    let socketServiceMock: SocketClientServiceMock;
    let socketTestHelper: SocketTestHelper;
    let service: CounterService;
    let gameSocketServiceStub: jasmine.SpyObj<GameSocketService>;

    beforeEach(() => {
        socketTestHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketTestHelper as unknown as Socket;
        gameSocketServiceStub = jasmine.createSpyObj<GameSocketService>('GameSocketService', ['playFeedbackSound', 'handleDifferenceFound'], {
            gameFeedbackService: jasmine.createSpyObj('GameFeedbackService', ['drawDifference']),
            socketService: socketServiceMock,
        });

        TestBed.configureTestingModule({
            imports: [RouterTestingModule, MatDialogModule],
            providers: [
                { provide: GameSocketService, useValue: gameSocketServiceStub },
                { provide: SocketClientService, useValue: socketServiceMock },
            ],
        });

        service = TestBed.inject(CounterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should handle difference found', () => {
        const playerName = 'player1';
        const difference: Pixel[] = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 2 },
        ];
        service.init(playerName);
        expect(service.differenceCounter instanceof Subject).toBeTrue();
        expect(service['count']).toEqual(0);
        socketTestHelper.peerSideEmit(`differenceFound${playerName}`, difference);
        expect(gameSocketServiceStub.playFeedbackSound).toHaveBeenCalledWith(true);
        expect(gameSocketServiceStub.gameFeedbackService.drawDifference).toHaveBeenCalledWith(difference);
        expect(service['count']).toEqual(1);
    });
});
