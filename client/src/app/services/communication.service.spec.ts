import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommunicationService } from '@app/services/communication.service';
import { Game } from '@common/game';
import { GameArchive } from '@common/game-archive';
import { PreviewWithoutImage1 } from '@common/preview';
import { of } from 'rxjs';

describe('CommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: CommunicationService;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(CommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        // eslint-disable-next-line dot-notation -- baseUrl is private and we need access for the test
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should not return any message when sending a POST request (HttpClient called once)', () => {
        const sentMessage: Game = {
            title: 'Hello',
            image1: 'World1',
            image2: 'World2',
            differences: [],
            bestTimes: { solo: [], versus: [] },
            isHard: false,
        };
        // subscribe to the mocked call
        service.createGamePost(sentMessage).subscribe({
            next: () => {
                return;
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/data/create`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(sentMessage);
        // actually send the request
        req.flush(sentMessage);
    });

    it('should return true when sending a GET request (HttpClient called once)', () => {
        const expectedMessage = true;
        // subscribe to the mocked call
        service.titleExistsGet('Hello').subscribe({
            next: (response: boolean) => {
                expect(response).toEqual(expectedMessage);
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/data/create/titleExists?title=Hello`);
        expect(req.request.method).toBe('GET');
        // actually send the request
        req.flush(expectedMessage);
    });

    it('should return getHistory', () => {
        const expectedArray: GameArchive[] = [];
        service.getHistory().subscribe({
            next: (response: GameArchive[]) => {
                expect(response).toEqual(expectedArray);
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/data/history`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedArray);
    });

    it('should return an observable of two game files', () => {
        const mySpy = spyOn(service, 'getGameFile').and.returnValue(of('test-game-true.txt'));
        const title = 'Test Game';
        service.getGameFiles(title);
        expect(mySpy).toHaveBeenCalledTimes(2);
    });

    it('should return a source for the original BMP image', () => {
        const expectedMessage = 'test';
        spyOn(URL, 'createObjectURL').and.returnValue(expectedMessage);

        service.getGameFile('Hello', true).subscribe({
            next: (response: string) => {
                expect(response).toEqual(expectedMessage);
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/data/game/file?title=Hello&image=1`);
        expect(req.request.method).toBe('GET');
        req.flush(new ArrayBuffer(0));
    });

    it('should return a source for the modified BMP image', () => {
        const expectedMessage = 'test';
        spyOn(URL, 'createObjectURL').and.returnValue(expectedMessage);

        service.getGameFile('Hello', false).subscribe({
            next: (response: string) => {
                expect(response).toEqual(expectedMessage);
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/data/game/file?title=Hello&image=2`);
        expect(req.request.method).toBe('GET');
        req.flush(new ArrayBuffer(0));
    });

    it('should return the page details', () => {
        const expectedMessage = { games: [], isLastPage: true, pageIndex: 0 };

        service.getGames(0).subscribe({
            next: (response: { games: PreviewWithoutImage1[]; isLastPage: boolean; pageIndex: number }) => {
                expect(response).toEqual(expectedMessage);
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/data/games?pageIndex=0`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedMessage);
    });

    it('deleteGame should send delete request to the correct path', () => {
        service.deleteGame('test').subscribe();
        const req = httpMock.expectOne(`${baseUrl}/data/game?title=test`);
        expect(req.request.method).toBe('DELETE');
    });

    it('deleteAllGames should send delete request to the correct path', () => {
        service.deleteAllGames().subscribe();
        const req = httpMock.expectOne(`${baseUrl}/data/games`);
        expect(req.request.method).toBe('DELETE');
    });

    it('deleteAllGames should send delete request to the correct path', () => {
        service.deleteHistory().subscribe();
        const req = httpMock.expectOne(`${baseUrl}/data/history`);
        expect(req.request.method).toBe('DELETE');
    });
});
