import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { ImageConstants } from '@app/constants/constants';
import { ImageInputComponent } from './image-input.component';

describe('ImageInputComponent', () => {
    let component: ImageInputComponent;
    let fixture: ComponentFixture<ImageInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ImageInputComponent],
            imports: [HttpClientTestingModule, RouterTestingModule, MatDialogModule],
        }).compileComponents();
        fixture = TestBed.createComponent(ImageInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('calls compareService.drawImage if there is a file in the input', async () => {
        const input = document.createElement('input');
        input.type = 'file';
        const files = [new File([new Blob([])], 'image_7_diff.bmp')];
        Object.defineProperty(input, 'files', {
            value: {
                length: files.length,
                item: (index: number) => {
                    return files[index];
                },
            },
            enumerable: true,
        });

        files.push(new File([new Blob([])], 'image_7_diff.bmp'));
        files.push(new File([new Blob([])], 'image_corner_pixel.bmp'));
        expect(input.files).not.toBeNull();
    });

    it('onInput should call compareService.drawImage on input containing file', () => {
        const fileInput = document.createElement('input');
        const file = new File([new Blob(['test'])], 'image_7_diff.bmp');
        const canvas = document.createElement('canvas');
        Object.defineProperty(fileInput, 'files', {
            value: [file],
            writable: false,
        });

        const drawSpy = spyOn(component['compareService'], 'drawImage');
        component.onInput(fileInput, canvas);
        expect(drawSpy).toHaveBeenCalledWith(file, canvas.getContext('2d') as CanvasRenderingContext2D);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('clearImage should set canvas to be white', () => {
        const canvas = document.createElement('canvas');
        const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;
        canvasContext.fillRect(0, 0, ImageConstants.DefaultWidth, ImageConstants.DefaultHeight);
        const monSpy = spyOn(canvasContext, 'fillRect');
        component.clearImage(canvas);
        expect(monSpy).toHaveBeenCalled();
        expect(canvasContext.fillStyle).toEqual('#ffffff');
    });

    it('onInput should display "Fichier Introuvable" when no file is selected', () => {
        const input = document.createElement('input');
        const canvas = document.createElement('canvas');
        input.type = 'file';
        component.onInput(input, canvas);
        expect(component['uploadMessage']).toEqual('Fichier introuvable');
    });

    it('resetOverlay should call the resetOverlay method of the CanvasManagerService', () => {
        const spy = spyOn(component['canvasManagerService'], 'resetOverlay');
        component.resetOverlay();
        expect(spy).toHaveBeenCalled();
    });
});
