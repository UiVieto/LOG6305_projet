import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BackgroundImageComponent } from '@app/components/background-image/background-image.component';
import { SettingsConsts, TestingValues } from '@app/constants/constants';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameSocketService } from '@app/services/game-socket.service';
import { SheetContainerService } from '@app/services/sheet-container.service';
import { GameSettings } from '@common/settings';
import { BehaviorSubject } from 'rxjs';
import { ConfigPageComponent } from './config-page.component';
import SpyObj = jasmine.SpyObj;

describe('ConfigPageComponent', () => {
    let component: ConfigPageComponent;
    let fixture: ComponentFixture<ConfigPageComponent>;
    let sheetContainerServiceSpy: SpyObj<SheetContainerService>;
    let gameSocketServiceSpy: jasmine.SpyObj<GameSocketService>;
    let settingsValueStub: BehaviorSubject<GameSettings>;

    beforeEach(async () => {
        settingsValueStub = new BehaviorSubject<GameSettings>({
            initialTime: SettingsConsts.MinCountdown,
            penaltyTime: SettingsConsts.DefaultIncrement,
            bonusTime: SettingsConsts.DefaultIncrement,
        });

        sheetContainerServiceSpy = jasmine.createSpyObj('sheetContainerSpy', ['isFirstPage', 'isLastPage', 'getSheets']);
        gameSocketServiceSpy = jasmine.createSpyObj('gameSocketService', ['resetTime', 'updateSettings'], {
            settingsValue: settingsValueStub,
        });

        await TestBed.configureTestingModule({
            declarations: [ConfigPageComponent, BackgroundImageComponent],
            imports: [AppMaterialModule, RouterTestingModule, FormsModule, ReactiveFormsModule],
            providers: [
                { provide: SheetContainerService, useValue: sheetContainerServiceSpy },
                HttpClient,
                HttpHandler,
                { provide: GameSocketService, useValue: gameSocketServiceSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(ConfigPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create and call getSheets of SheetContainerService on initialization', () => {
        expect(sheetContainerServiceSpy.getSheets).toHaveBeenCalledWith(0);
    });

    it('should set the title to configuration', () => {
        expect(component.title).toEqual('Configuration');
    });

    it('should initialize the settings form', () => {
        spyOn(component, 'initSettingsform');
        component.ngOnInit();
        expect(component.initSettingsform).toHaveBeenCalled();
    });

    it('resetTime() should reset the times of a sheet', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        const gameTitle = 'test';
        component.resetTime(gameTitle);
        expect(gameSocketServiceSpy.resetTime).toHaveBeenCalledWith(gameTitle);
    });

    it('resetAllBestTimes() should reset all best times', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        gameSocketServiceSpy.resetTime = jasmine.createSpy('resetAllBestTimes');
        component.resetAllBestTimes();
        expect(gameSocketServiceSpy.resetTime).toHaveBeenCalled();
    });

    it('should call gameSocketService.updateSettings with the right params', () => {
        component.initialTime = SettingsConsts.MinCountdown;
        component.penaltyTime = SettingsConsts.DefaultIncrement;
        component.bonusTime = SettingsConsts.DefaultIncrement;
        component.updateSettings();
        expect(gameSocketServiceSpy.updateSettings).toHaveBeenCalledWith(
            SettingsConsts.MinCountdown,
            SettingsConsts.DefaultIncrement,
            SettingsConsts.DefaultIncrement,
        );
    });

    it('should change the value of button innertext on updateSettings', fakeAsync(() => {
        component.initialTime = SettingsConsts.MinCountdown;
        component.penaltyTime = SettingsConsts.DefaultIncrement;
        component.bonusTime = SettingsConsts.DefaultIncrement;
        component.updateSettings();
        expect(component.validate.nativeElement.innerText.toLowerCase()).toEqual('succès!');
        tick(TestingValues.SuccessToValidateTimeout);
        expect(component.validate.nativeElement.innerText.toLowerCase()).toEqual('valider');
    }));

    it('resetSettings should reinit settings', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        component.initialTime = 31;
        component.penaltyTime = 6;
        component.bonusTime = 6;
        component.updateSettings();
        component.resetSettings();
        expect(component.initialTime).toEqual(SettingsConsts.MinCountdown);
        expect(component.penaltyTime).toEqual(SettingsConsts.DefaultIncrement);
        expect(component.bonusTime).toEqual(SettingsConsts.DefaultIncrement);
    });
});
