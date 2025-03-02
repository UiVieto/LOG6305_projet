import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CompareService } from '@app/services/compare.service';
import { of } from 'rxjs';
import { ComparePopupComponent } from './compare-popup.component';

describe('ComparePopupComponent', () => {
    let component: ComparePopupComponent;
    let fixture: ComponentFixture<ComparePopupComponent>;

    const compareMock = {
        validateDifferences: () => {
            return { difficulty: 'invalide', nbDifferences: 0 };
        },
        createGame: () => {
            return of(true);
        },
    };

    const dialogMock = {
        close: () => {
            return;
        },
    };

    beforeEach(async () => {
        const canvas = document.createElement('canvas');
        await TestBed.configureTestingModule({
            declarations: [ComparePopupComponent],
            imports: [MatDialogModule, HttpClientTestingModule],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { canvas } },
                { provide: MatDialogRef, useValue: dialogMock },
                { provide: CompareService, useValue: compareMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ComparePopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a canvas', () => {
        expect(component.content.nativeElement.children.length).toBe(1);
    });

    it('onValidate should set the displayed message correctly', () => {
        const validateSpy = spyOn(component['compareService'], 'validateDifferences');

        validateSpy.and.returnValue({ difficulty: 'invalide', nbDifferences: 10 });
        component.onValidate();
        expect(component.displayedMessage).toEqual('Erreur : nombre de différences invalide (10 trouvées, veuillez en générer entre 3 et 9).');

        validateSpy.and.returnValue({ difficulty: 'difficile', nbDifferences: 8 });
        component.onValidate();
        expect(component.displayedMessage).toEqual('Niveau : difficile avec 8 différences.');

        validateSpy.and.returnValue({ difficulty: 'facile', nbDifferences: 4 });
        component.onValidate();
        expect(component.displayedMessage).toEqual('Niveau : facile avec 4 différences.');
    });

    it('onInput should set title to the input value', () => {
        const input = document.createElement('input');
        const button = document.createElement('button');
        input.value = 'test';
        component.onInput(input, button);
        expect(component['title']).toBe(input.value);
    });

    it('onSubmit should disable button with invalid title', () => {
        const input = document.createElement('input');
        const button = document.createElement('button');
        input.value = '*';
        component.onInput(input, button);
        expect(button.disabled).toBeTrue();
    });

    it('onSubmit should enable button with valid title', () => {
        const input = document.createElement('input');
        const button = document.createElement('button');
        input.value = 'hello';
        component.onInput(input, button);
        expect(button.disabled).toBeFalse();
    });

    it('onSubmit should not create a game if title exists', () => {
        spyOn(component['compareService'], 'createGame').and.returnValue(of(true));
        component['title'] = 'title';
        component.onSubmit();
        expect(component.displayedMessage).toEqual('Erreur: ce titre existe déjà.');
    });

    it("onSubmit should create a game if title doesn't exist", () => {
        spyOn(component['compareService'], 'createGame').and.returnValue(of(false));
        const spy = spyOn(component['dialogRef'], 'close');
        component['title'] = 'title';
        component.onSubmit();
        expect(spy).toHaveBeenCalledWith(true);
    });
});
