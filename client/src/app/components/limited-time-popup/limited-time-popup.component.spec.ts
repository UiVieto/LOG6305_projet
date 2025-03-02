import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitedTimePopupComponent } from './limited-time-popup.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('LimitedTimePopupComponent', () => {
    let component: LimitedTimePopupComponent;
    let fixture: ComponentFixture<LimitedTimePopupComponent>;
    const dialogMock = {
        close: () => {
            return;
        },
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [LimitedTimePopupComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: 'Jouer!' },
                { provide: MatDialogRef, useValue: dialogMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LimitedTimePopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.username).toEqual('');
    });

    it('should set username', () => {
        const input = document.createElement('input');
        input.value = 'test';
        component.onInput(input);
        expect(component.username).toEqual('test');
    });

    it('should close dialog with correct info', () => {
        const spy = spyOn(component['dialogRef'], 'close').and.callThrough();
        component.username = 'user';
        component.onSubmit('test');
        expect(spy).toHaveBeenCalledWith({ username: 'user', mode: 'test' });
    });
});
