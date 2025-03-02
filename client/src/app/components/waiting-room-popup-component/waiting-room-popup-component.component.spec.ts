import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { GameSocketService } from '@app/services/game-socket.service';

import { WaitingRoomPopupComponent } from './waiting-room-popup-component.component';

describe('WaitingRoomPopupComponentComponent', () => {
    let component: WaitingRoomPopupComponent;
    let fixture: ComponentFixture<WaitingRoomPopupComponent>;

    let socketServiceStub: jasmine.SpyObj<GameSocketService>;
    const dialogMock = {
        close: () => {
            return;
        },
    };

    beforeEach(async () => {
        socketServiceStub = jasmine.createSpyObj('GameSocketService', ['cancelWaitingRoom']);

        await TestBed.configureTestingModule({
            declarations: [WaitingRoomPopupComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: GameSocketService, useValue: socketServiceStub },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: dialogMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
