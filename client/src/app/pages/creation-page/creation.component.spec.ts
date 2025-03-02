import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BackgroundImageComponent } from '@app/components/background-image/background-image.component';
import { GoBackComponent } from '@app/components/creation-page/go-back/go-back.component';
import { ImageInputComponent } from '@app/components/creation-page/image-input/image-input.component';
import { TitleComponent } from '@app/components/creation-page/title/title.component';
import { ToolbarComponent } from '@app/components/creation-page/toolbar/toolbar.component';
import { VerticalToolbarComponent } from '@app/components/creation-page/vertical-toolbar/vertical-toolbar.component';
import { CreationComponent } from './creation.component';

describe('CreationComponent', () => {
    let component: CreationComponent;
    let fixture: ComponentFixture<CreationComponent>;

    let canvasStub: HTMLCanvasElement;
    let contextStub: CanvasRenderingContext2D;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CreationComponent,
                ImageInputComponent,
                ToolbarComponent,
                VerticalToolbarComponent,
                BackgroundImageComponent,
                GoBackComponent,
                TitleComponent,
            ],
            imports: [MatDialogModule, HttpClientTestingModule, RouterTestingModule],
        }).compileComponents();

        canvasStub = document.createElement('canvas') as HTMLCanvasElement;
        contextStub = canvasStub.getContext('2d') as CanvasRenderingContext2D;

        fixture = TestBed.createComponent(CreationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should iniitialize the canvases', () => {
        expect(component.canvas1).toBeTruthy();
        expect(component.canvas2).toBeTruthy();
    });

    it('should initialize the services', () => {
        const compareSpy = spyOn(component.compareService, 'initContexts');
        const canvasSpy = spyOn(component['canvasManagerService'], 'initContexts');
        const drawSpy = spyOn(component['drawService'], 'initContexts');
        const historySpy = spyOn(component['historyService'], 'initContexts');

        expect(component.compareService).toBeTruthy();
        expect(component['canvasManagerService']).toBeTruthy();
        expect(component['drawService']).toBeTruthy();
        expect(component['historyService']).toBeTruthy();

        component.ngAfterViewInit();

        expect(compareSpy).toHaveBeenCalled();
        expect(canvasSpy).toHaveBeenCalled();
        expect(drawSpy).toHaveBeenCalled();
        expect(historySpy).toHaveBeenCalled();
    });

    it('should initialize both canvases with a white background', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = spyOn<any>(component, 'drawWhiteImage');
        component.ngAfterViewInit();
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('drawWhiteImage should draw a white background', () => {
        const spy = spyOn(contextStub, 'fillRect');
        component['drawWhiteImage'](canvasStub);
        expect(contextStub.fillStyle).toEqual('#ffffff');
        expect(spy).toHaveBeenCalledWith(0, 0, canvasStub.width, canvasStub.height);
    });
});
