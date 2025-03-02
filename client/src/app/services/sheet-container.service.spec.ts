import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { GameArchive } from '@common/game-archive';
import { GameType } from '@common/game-instance';
import { PageDetails, PreviewWithoutImage1 } from '@common/preview';
import { of } from 'rxjs';
import { CommunicationService } from './communication.service';
import { SheetContainerService } from './sheet-container.service';

describe('SheetContainerService', () => {
    const httpResponse: PageDetails = {
        games: [
            {
                title: '1',
                bestTimes: {
                    solo: [
                        { playerName: 'p1', time: 10 },
                        { playerName: 'p2', time: 10 },
                        { playerName: 'p3', time: 10 },
                    ],
                    versus: [
                        { playerName: 'p1', time: 10 },
                        { playerName: 'p2', time: 10 },
                        { playerName: 'p3', time: 10 },
                    ],
                },
                isHard: false,
                isInitiallyVsActive: false,
            },
            {
                title: '2',
                bestTimes: {
                    solo: [
                        { playerName: 'p1', time: 10 },
                        { playerName: 'p2', time: 10 },
                        { playerName: 'p3', time: 10 },
                    ],
                    versus: [
                        { playerName: 'p1', time: 10 },
                        { playerName: 'p2', time: 10 },
                        { playerName: 'p3', time: 10 },
                    ],
                },
                isHard: true,
                isInitiallyVsActive: false,
            },
        ],
        isLastPage: true,
        pageIndex: 1,
    };

    const httpArchive: GameArchive[] = [
        {
            gameTitle: 'test',
            startDate: 0,
            playingTime: 10,
            endClock: 10,
            gameMode: GameType.Classic,
            p1Name: 'p1',
            p2Name: '',
            isPlayer1: true,
            hasAbandoned: false,
        },
    ];

    let service: SheetContainerService;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let comSpy: jasmine.SpyObj<CommunicationService>;

    beforeEach(() => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        comSpy = jasmine.createSpyObj('CommunicationService', [
            'getGames',
            'getGameFile',
            'deleteGame',
            'getHistory',
            'deleteHistory',
            'deleteAllGames',
        ]);
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: CommunicationService, useValue: comSpy },
            ],
        }).compileComponents();
        service = TestBed.inject(SheetContainerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getSheet() should set the service attributes according to the response', () => {
        comSpy.getGames.and.returnValue(of(httpResponse));
        comSpy.getGameFile.and.returnValue(of('newSrc'));
        service.pageIndex = 3;
        service.isLastPage = false;

        service.getSheets(1);

        expect(service.pageIndex).toEqual(1);
        expect(service.isLastPage).toBeTruthy();
    });

    it('nextIndex() should call getSheets with pageIndex + 1', () => {
        service.pageIndex = 1;
        const getSheetsSpy = spyOn(service, 'getSheets');
        service.nextIndex();
        expect(getSheetsSpy).toHaveBeenCalledWith(2);
    });

    it('previousIndex() should call getSheets with pageIndex - 1', () => {
        service.pageIndex = 1;
        const getSheetsSpy = spyOn(service, 'getSheets');
        service.previousIndex();
        expect(getSheetsSpy).toHaveBeenCalledWith(0);
    });

    it('deleteAllSheets should delete all sheets', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        comSpy.deleteAllGames.and.returnValue(of(httpResponse));
        service.deleteAllSheets();
        expect(service.currentGames).toEqual([]);
        expect(comSpy.deleteAllGames).toHaveBeenCalled();
    });

    it('deleteSheet() should delete sheet and call deleteGame of CommunicationService', async () => {
        spyOn(window, 'confirm').and.returnValue(true);
        service.getSheets = jasmine.createSpy('getSheets').and.returnValue(of(httpResponse));
        comSpy.deleteGame.and.returnValue(of('response'));
        service.currentGames = [];
        httpResponse.games.forEach((game: PreviewWithoutImage1) => {
            service.currentGames.push({ ...game, image1: of('src') });
        });
        const gameToDelete = service.currentGames[0].title;
        service.deleteSheet(gameToDelete);
        expect(comSpy.deleteGame).toHaveBeenCalledOnceWith(gameToDelete);
    });

    it('getHistory() should set the service attributes according to the response', () => {
        comSpy.getHistory.and.returnValue(of(httpArchive));
        service.getHistory();
        expect(service.currentHistory).toEqual(httpArchive);
    });

    it('deleteHistory() should set the service attributes according to the response', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        service.currentHistory = httpArchive;
        comSpy.deleteHistory.and.returnValue(of(httpArchive));
        service.deleteHistory();
        expect(service.currentHistory).toEqual([]);
        expect(comSpy.deleteHistory).toHaveBeenCalled();
    });
});
