import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { CounterService } from '@app/services/counter.service';
import { GameSocketService } from '@app/services/game-socket.service';

import { GameType } from '@common/game-instance';
import { DifferenceCounterComponent } from './difference-counter.component';

describe('DifferenceCounterComponent', () => {
    let component: DifferenceCounterComponent;
    let fixture: ComponentFixture<DifferenceCounterComponent>;
    let gameComs: GameSocketService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DifferenceCounterComponent],
            imports: [RouterTestingModule, HttpClientTestingModule],
            providers: [{ provide: MatDialog, useValue: {} }, GameSocketService, CounterService],
        }).compileComponents();
        gameComs = TestBed.inject(GameSocketService);
        gameComs.gameInstance = {
            title: 'test',
            isHard: false,
            nbDiff: 3,
            players: ['user1', 'user2'],
            gameMode: GameType.Classic,
            hintPenalty: 30,
        };
        fixture = TestBed.createComponent(DifferenceCounterComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    it('should create', () => {
        const nbDiff = Math.ceil(gameComs.gameInstance.nbDiff / gameComs.gameInstance.players.length);

        expect(component).toBeTruthy();
        expect(component.nbDifferences).toEqual(nbDiff);
        expect(component.differencesFound).toEqual(0);
    });

    it('should update differencesFound', () => {
        const counterService = fixture.debugElement.injector.get(CounterService);
        counterService.init('user1');
        counterService.differenceCounter.next(1);
        expect(component.differencesFound).toEqual(1);
        const counterService2 = fixture.debugElement.injector.get(CounterService);
        counterService2.init('user2');
        counterService2.differenceCounter.next(2);
        expect(component.differencesFound).toEqual(2);
    });
});
