import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildrenOutletContexts, UrlSerializer } from '@angular/router';
import { ProgressCounterService } from '@app/services/progress-counter.service';
import { ProgressCounterComponent } from './progress-counter.component';

import { Overlay } from '@angular/cdk/overlay';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { GameSocketService } from '@app/services/game-socket.service';
import { GameType } from '@common/game-instance';

describe('ProgressCounterComponent', () => {
    let component: ProgressCounterComponent;
    let fixture: ComponentFixture<ProgressCounterComponent>;
    let progressCounter: jasmine.SpyObj<ProgressCounterService>;
    let gameSocketService: GameSocketService;

    beforeEach(async () => {
        progressCounter = jasmine.createSpyObj('ProgressCounterService', ['differenceCounter']);
        await TestBed.configureTestingModule({
            declarations: [ProgressCounterComponent],
            imports: [RouterTestingModule, MatDialogModule],
            providers: [
                UrlSerializer,
                ChildrenOutletContexts,
                HttpClient,
                HttpHandler,
                MatDialog,
                Overlay,
                { provide: ProgressCounterService, useValue: progressCounter },
            ],
        }).compileComponents();

        gameSocketService = TestBed.inject(GameSocketService);
        fixture = TestBed.createComponent(ProgressCounterComponent);
        progressCounter = TestBed.inject(ProgressCounterService);
        component = fixture.componentInstance;

        gameSocketService.gameInstance = {
            title: 'test',
            isHard: false,
            nbDiff: 3,
            players: ['player1', 'player2'],
            gameMode: GameType.Classic,
            hintPenalty: 30,
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set differenceFound', () => {
        const counterService = fixture.debugElement.injector.get(ProgressCounterService);
        counterService.differenceCounter.next(1);
        expect(component.differencesFound).toEqual(1);
        const counterService2 = fixture.debugElement.injector.get(ProgressCounterService);
        counterService2.differenceCounter.next(2);
        expect(component.differencesFound).toEqual(2);
    });
});
