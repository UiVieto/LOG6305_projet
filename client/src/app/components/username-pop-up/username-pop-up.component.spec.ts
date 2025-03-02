import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router, UrlSerializer } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UsernamePopUpComponent } from './username-pop-up.component';

describe('UsernamePopUpComponent', () => {
    let component: UsernamePopUpComponent;
    let fixture: ComponentFixture<UsernamePopUpComponent>;
    const dialogMock = {
        close: () => {
            return;
        },
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UsernamePopUpComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: 'Jouer!' },
                { provide: HttpClient, useValue: {} },
                { provide: UrlSerializer, useValue: {} },
                { provide: Router, useValue: {} },
                { provide: MatDialogRef, useValue: dialogMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(UsernamePopUpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onInput should change the username value ', () => {
        const input = document.createElement('input');
        const div = document.createElement('div');
        input.value = 'username';
        component.onInput(input, div);
        expect(component.username).toEqual('username');
    });

    it('should not close the dialog if the player submits for a multiplayer game with an incorrect username', () => {
        const isValidUsername = new BehaviorSubject<boolean>(false);

        const spy = spyOn(component.dialogRef, 'close').and.callThrough();

        const mockGameSocketService = jasmine.createSpyObj('GameSocketService', ['validateUsername'], {
            isValidUsername,
        });

        component.gameSocketService = mockGameSocketService;
        component.data = 'not Jouer';
        component.username = 'username';
        component.onSubmit();

        expect(mockGameSocketService.validateUsername).toHaveBeenCalledWith('username');
        expect(spy).not.toHaveBeenCalled();
        expect(component.prompt).toEqual('Ce nom est déjà utilisé');
    });

    it('should close the dialog if the player submits for a multiplayer game with a correct username', () => {
        const isValidUsername = new BehaviorSubject<boolean>(true);

        const spy = spyOn(component.dialogRef, 'close').and.callThrough();

        const mockGameSocketService = jasmine.createSpyObj('GameSocketService', ['validateUsername'], {
            isValidUsername,
        });

        component.gameSocketService = mockGameSocketService;
        component.data = 'not Jouer';
        component.username = 'username';
        component.onSubmit();

        expect(mockGameSocketService.validateUsername).toHaveBeenCalledWith('username');
        expect(spy).toHaveBeenCalledWith('username');
    });

    it('should close the dialog if the player submits for a singleplayer game', () => {
        const spy = spyOn(component.dialogRef, 'close').and.callThrough();

        component.data = 'Jouer';
        component.username = 'username';
        component.onSubmit();

        expect(spy).toHaveBeenCalledWith('username');
    });

    it('should remove listener on destroy', () => {
        spyOn(window, 'removeEventListener').and.callThrough();
        component.onSubmit = jasmine.createSpy('onSubmit');
        component.ngOnDestroy();
        fixture.detectChanges();
        expect(window.removeEventListener).toHaveBeenCalled();
    });

    it('should call on submit', () => {
        component.onSubmit = jasmine.createSpy('onSubmit');
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        component['eventListener'](enterEvent);
        expect(component.onSubmit).toHaveBeenCalledWith();
    });
});
