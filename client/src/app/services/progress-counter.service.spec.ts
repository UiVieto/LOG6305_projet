import { TestBed } from '@angular/core/testing';

import { Overlay } from '@angular/cdk/overlay';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChildrenOutletContexts, UrlSerializer } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { GameInstance, GameType } from '@common/game-instance';
import { Socket } from 'socket.io-client';
import { GameFeedbackService } from './game-feedback.service';
import { GameSocketService } from './game-socket.service';
import { ProgressCounterService } from './progress-counter.service';
import { SocketClientService } from './socket-client.service';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('ProgressCounterServiceService', () => {
    let service: ProgressCounterService;
    let gameSocketService: GameSocketService;
    let gameFeedbackService: GameFeedbackService;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
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
        gameFeedbackService = TestBed.inject(GameFeedbackService);
        service = TestBed.inject(ProgressCounterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should init attributes ', () => {
        const game: GameInstance = {
            title: '',
            isHard: false,
            nbDiff: 0,
            players: ['user1'],
            gameMode: GameType.Classic,
            hintPenalty: 30,
        };
        const files = { image1: [] as unknown as ArrayBuffer, image2: [] as unknown as ArrayBuffer, gameData: game };
        gameFeedbackService.synchronizeNewSheet = jasmine.createSpy('synchronize');
        gameSocketService.playFeedbackSound = jasmine.createSpy('playSoundBack');
        socketHelper.peerSideEmit('differenceFound', files);
        expect(gameSocketService.playFeedbackSound).toHaveBeenCalled();
        expect(gameFeedbackService.synchronizeNewSheet).toHaveBeenCalled();
        expect(gameSocketService.gameInstance).toEqual(files.gameData);
    });

    it('should init attributes ', () => {
        const game: GameInstance = {
            title: '',
            isHard: false,
            nbDiff: 0,
            players: ['user1', 'user2'],
            gameMode: GameType.Classic,
            hintPenalty: 30,
        };
        gameSocketService.gameInstance = game;
        socketHelper.peerSideEmit('playerLeft', ['user1']);
        expect(gameSocketService.gameInstance.players).toEqual(['user1']);
    });
});
