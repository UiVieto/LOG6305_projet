import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BackgroundImageComponent } from '@app/components/background-image/background-image.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameSocketService } from '@app/services/game-socket.service';
import { SheetContainerService } from '@app/services/sheet-container.service';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SelectionPageComponent } from './game-selection.component';
import SpyObj = jasmine.SpyObj;

describe('SelectionPageComponent', () => {
    let component: SelectionPageComponent;
    let fixture: ComponentFixture<SelectionPageComponent>;
    let sheetContainerServiceSpy: SpyObj<SheetContainerService>;
    let gameSocketServiceSpy: SpyObj<GameSocketService>;

    beforeEach(async () => {
        sheetContainerServiceSpy = jasmine.createSpyObj('sheetContainerSpy', ['getSheets']);
        gameSocketServiceSpy = jasmine.createSpyObj('gameSocketServiceSpy', ['joinSelectionRoom']);

        await TestBed.configureTestingModule({
            declarations: [SelectionPageComponent, BackgroundImageComponent],
            imports: [AppMaterialModule, RouterTestingModule],
            providers: [
                { provide: SheetContainerService, useValue: sheetContainerServiceSpy },
                { provide: GameSocketService, useValue: gameSocketServiceSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(SelectionPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and call getSheets of SheetContainerService after initialization', () => {
        expect(component).toBeTruthy();
        expect(sheetContainerServiceSpy.getSheets).toHaveBeenCalled();
    });

    it('should call joinSelectionRoom of GameSocketService after initialization', () => {
        expect(gameSocketServiceSpy.joinSelectionRoom).toHaveBeenCalled();
    });
});
