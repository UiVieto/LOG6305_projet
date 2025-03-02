import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadButtonComponent } from './download-button.component';

describe('DownloadButtonComponent', () => {
    let component: DownloadButtonComponent;
    let fixture: ComponentFixture<DownloadButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DownloadButtonComponent],
            imports: [HttpClientTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(DownloadButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onInput should call compareService.drawImage on input containing file', () => {
        const fileInput = document.createElement('input');
        const file = new File([new Blob(['test'])], 'image_7_diff.bmp');
        Object.defineProperty(fileInput, 'files', {
            value: [file],
            writable: false,
        });

        const drawSpy = spyOn(component['compareService'], 'drawImage');
        component.onInput(fileInput);
        expect(drawSpy).toHaveBeenCalledWith(file);
    });

    it('onInput should display "Fichier Introuvable" when no file is selected', () => {
        const input = document.createElement('input');
        input.type = 'file';
        component.onInput(input);
        expect(component['uploadMessage']).toEqual('Fichier introuvable');
    });
});
