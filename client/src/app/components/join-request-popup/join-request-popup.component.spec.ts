import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GameSocketService } from '@app/services/game-socket.service';

import { JoinRequestPopupComponent } from './join-request-popup.component';

describe('JoinRequestPopupComponent', () => {
    let component: JoinRequestPopupComponent;
    let fixture: ComponentFixture<JoinRequestPopupComponent>;
    let socketServiceStub: jasmine.SpyObj<GameSocketService>;
    let dialogRef: MatDialogRef<JoinRequestPopupComponent>;
    beforeEach(async () => {
        socketServiceStub = jasmine.createSpyObj('GameSocketService', ['refusePlayer', 'acceptPlayer']);

        await TestBed.configureTestingModule({
            declarations: [JoinRequestPopupComponent],
            providers: [
                { provide: GameSocketService, useValue: socketServiceStub },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: { dialogRef } },
            ],
        }).compileComponents();
        dialogRef = TestBed.inject(MatDialogRef);
        fixture = TestBed.createComponent(JoinRequestPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close dialogRef on refuse', () => {
        component.dialogRef.close = jasmine.createSpy();
        component.refuse();
        expect(component.dialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should close dialogRef on refuse', () => {
        component.dialogRef.close = jasmine.createSpy();
        component.accept();
        expect(component.dialogRef.close).toHaveBeenCalledWith(true);
    });
});
