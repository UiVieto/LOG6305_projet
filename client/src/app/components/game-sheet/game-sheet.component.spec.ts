import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameSheetComponent } from './game-sheet.component';

describe('GameSheetComponent', () => {
    let component: GameSheetComponent;
    let fixture: ComponentFixture<GameSheetComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GameSheetComponent],
            imports: [AppMaterialModule],
        }).compileComponents();

        fixture = TestBed.createComponent(GameSheetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('sanitize method', () => {
        it('should return null on null URL', () => {
            expect(component.sanitize(null)).toEqual(null);
        });
        it('should sanitize on not null URL', () => {
            const sanitizeSpy = spyOn(component['sanitizer'], 'bypassSecurityTrustUrl');
            component.sanitize('url');
            expect(sanitizeSpy).toHaveBeenCalledWith('url');
        });

        it('should return correct format of time', () => {
            const time = 61;
            expect(component.formatTime(time)).toEqual('1:01');
        });

        it('should return correct format of time', () => {
            const time = 75;
            expect(component.formatTime(time)).toEqual('1:15');
        });
    });
});
