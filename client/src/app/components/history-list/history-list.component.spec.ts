import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Overlay } from '@angular/cdk/overlay';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElementRef, QueryList } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SheetContainerService } from '@app/services/sheet-container.service';
import { GameType } from '@common/game-instance';
import { HistoryListComponent } from './history-list.component';

describe('HistoryListComponent', () => {
    let component: HistoryListComponent;
    let fixture: ComponentFixture<HistoryListComponent>;
    let sheetContainerStub: jasmine.SpyObj<SheetContainerService>;
    beforeEach(async () => {
        const gArchive = [
            {
                gameTitle: 'test',
                startDate: 0,
                playingTime: 10,
                endClock: 10,
                gameMode: GameType.Classic,
                p1Name: 'p1',
                p2Name: 'p2',
                isPlayer1: true,
                hasAbandoned: false,
            },

            {
                gameTitle: 'test2',
                startDate: 0,
                playingTime: 10,
                endClock: 10,
                gameMode: GameType.Classic,
                p1Name: 'p1',
                p2Name: 'p2',
                isPlayer1: false,
                hasAbandoned: false,
            },

            {
                gameTitle: 'test3',
                startDate: 0,
                playingTime: 10,
                endClock: 10,
                gameMode: GameType.Classic,
                p1Name: 'p1',
                p2Name: 'p2',
                isPlayer1: false,
                hasAbandoned: true,
            },

            {
                gameTitle: 'test4',
                startDate: 0,
                playingTime: 10,
                endClock: 10,
                gameMode: GameType.Classic,
                p1Name: 'p1',
                p2Name: 'p2',
                isPlayer1: true,
                hasAbandoned: true,
            },

            {
                gameTitle: 'test5',
                startDate: 0,
                playingTime: 10,
                endClock: 1000,
                gameMode: GameType.LimitedTime,
                p1Name: 'p1',
                p2Name: 'p2',
                isPlayer1: true,
                hasAbandoned: false,
            },
        ];

        sheetContainerStub = jasmine.createSpyObj('SheetContainerService', ['getHistory'], {
            currentHistory: gArchive,
        });
        await TestBed.configureTestingModule({
            declarations: [HistoryListComponent],
            imports: [MatDialogModule, HttpClientTestingModule],
            providers: [MatDialog, Overlay, { provide: SheetContainerService, useValue: sheetContainerStub }],
        }).compileComponents();
        fixture = TestBed.createComponent(HistoryListComponent);
        component = fixture.componentInstance;
        component.currentHistory = gArchive;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get history on init', () => {
        component.ngOnInit();
        expect(sheetContainerStub.getHistory).toHaveBeenCalled();
    });

    it('should format Date when formatDate is called with parameter', () => {
        const date = 0;
        const dateFormatted = component.formatDate(date);
        expect(dateFormatted).toEqual('31/12/1969, 19:00:00');
    });

    it('should filter results when changes are made', async () => {
        component['filterResults'] = jasmine.createSpy('filterResults').and.returnValue(Promise.resolve());

        await component.ngOnChanges();

        expect(component['filterResults']).toHaveBeenCalled();
    });

    it('formats time in seconds to minutes:seconds format', async () => {
        const timer = 61000;
        const time = '01:01';
        expect(time).toContain(component.formatTime(timer));
    });

    it('should filter results ', async () => {
        const index = 4;
        const elementRefMock1 = {
            nativeElement: {
                textContent: 'user1',
                style: {
                    fontWeight: 'normal',
                    textDecoration: 'normal',
                },
            },
        };
        const elementRefMock2 = {
            nativeElement: {
                textContent: 'user2',
                style: {
                    fontWeight: 'normal',
                    textDecoration: 'normal',
                },
            },
        };
        component.username1 = Object.assign(new QueryList(), {
            _results: [elementRefMock1, elementRefMock1, elementRefMock1, elementRefMock1, elementRefMock1],
        }) as QueryList<ElementRef>;
        component.username2 = Object.assign(new QueryList(), {
            _results: [elementRefMock2, elementRefMock2, elementRefMock2, elementRefMock2, elementRefMock2],
        }) as QueryList<ElementRef>;
        await component['filterResults'](0);
        expect(component.username1.get(0)?.nativeElement.style.fontWeight).toEqual('bold');

        await component['filterResults'](1);
        expect(component.username2.get(1)?.nativeElement.style.fontWeight).toEqual('bold');

        await component['filterResults'](2);
        expect(component.username2.get(2)?.nativeElement.style.textDecoration).toEqual('line-through');

        await component['filterResults'](3);
        expect(component.username1.get(3)?.nativeElement.style.textDecoration).toEqual('line-through');

        await component['filterResults'](index);
        expect(component.username1.get(index)?.nativeElement.style.fontWeight).toEqual('bold');
        expect(component.username2.get(index)?.nativeElement.style.fontWeight).toEqual('bold');
    });
});
