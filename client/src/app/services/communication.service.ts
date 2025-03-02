import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HTTPConstants } from '@app/constants/constants';
import { Game } from '@common/game';
import { GameArchive } from '@common/game-archive';
import { PageDetails } from '@common/preview';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string = environment.serverUrl + 'api';

    constructor(private readonly http: HttpClient) {}

    createGamePost(game: Game): Observable<boolean> {
        return this.http
            .post(`${this.baseUrl}/data/create`, game, { observe: 'response', responseType: 'text' })
            .pipe(map((res) => res.status === HTTPConstants.Created));
    }

    titleExistsGet(title: string): Observable<boolean> {
        return this.http
            .get(`${this.baseUrl}/data/create/titleExists?title=${title}`, {
                observe: 'body',
                responseType: 'text',
            })
            .pipe(map((body) => JSON.parse(body)));
    }

    getGameFile(title: string, original: boolean): Observable<string> {
        return this.http.get(`${this.baseUrl}/data/game/file?title=${title}&image=${original ? '1' : '2'}`, { responseType: 'arraybuffer' }).pipe(
            map((file) => {
                return URL.createObjectURL(new Blob([file]));
            }),
        );
    }

    getGameFiles(title: string): Observable<[string, string]> {
        return forkJoin([this.getGameFile(title, true), this.getGameFile(title, false)]);
    }

    getGames(pageIndex: number): Observable<PageDetails> {
        return this.http
            .get(`${this.baseUrl}/data/games?pageIndex=${pageIndex}`, { observe: 'body', responseType: 'text' })
            .pipe(map((body) => JSON.parse(body)));
    }

    getHistory(): Observable<GameArchive[]> {
        return this.http.get(`${this.baseUrl}/data/history`, { observe: 'body', responseType: 'text' }).pipe(map((body) => JSON.parse(body)));
    }

    deleteGame(title: string) {
        return this.http.delete(`${this.baseUrl}/data/game?title=${title}`);
    }

    deleteAllGames() {
        return this.http.delete(`${this.baseUrl}/data/games`);
    }

    deleteHistory() {
        return this.http.delete(`${this.baseUrl}/data/history`);
    }
}
