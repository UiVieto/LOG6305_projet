import { Overlay } from '@angular/cdk/overlay';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ChildrenOutletContexts, UrlSerializer } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameSocketService } from '@app/services/game-socket.service';
import { BehaviorSubject } from 'rxjs';
import { TimerComponent } from './timer.component';

describe('TimerComponent', () => {
    let component: TimerComponent;
    let fixture: ComponentFixture<TimerComponent>;

    const dialogMock = {
        close: () => {
            return;
        },
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TimerComponent],
            imports: [RouterTestingModule, MatDialogModule],
            providers: [
                UrlSerializer,
                ChildrenOutletContexts,
                { provide: GameSocketService, useValue: { serverTimer: new BehaviorSubject<number>(0) } },
                HttpClient,
                HttpHandler,
                MatDialog,
                Overlay,
                { provide: MAT_DIALOG_DATA, useValue: {} },
                {
                    provide: MatDialogRef,
                    useValue: dialogMock,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TimerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update differencesFound', () => {
        const socketService = fixture.debugElement.injector.get(GameSocketService);
        component['formatTime'] = jasmine.createSpy('formatTime');
        socketService.serverTimer.next(1);
        expect(component['formatTime']).toHaveBeenCalledWith(1);
        const socketService2 = fixture.debugElement.injector.get(GameSocketService);
        socketService2.serverTimer.next(2);
        expect(component['formatTime']).toHaveBeenCalledWith(2);
    });
});
