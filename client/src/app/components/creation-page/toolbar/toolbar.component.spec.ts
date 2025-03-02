import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSliderChange } from '@angular/material/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Tool } from '@app/classes/tool';
import { ConfigPageComponent } from '@app/pages/config-page/config-page.component';
import { CompareService } from '@app/services/compare.service';
import { DrawService } from '@app/services/draw.service';
import { HistoryService } from '@app/services/history.service';
import { Observable, of } from 'rxjs';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
    let component: ToolbarComponent;
    let fixture: ComponentFixture<ToolbarComponent>;

    let compareServiceSpy: jasmine.SpyObj<CompareService>;
    let drawServiceSpy: jasmine.SpyObj<DrawService>;
    let historyServiceSpy: jasmine.SpyObj<HistoryService>;

    class DialogMock {
        open(): { afterClosed: () => Observable<boolean> } {
            return {
                afterClosed: () => of(true),
            };
        }
    }

    beforeEach(async () => {
        drawServiceSpy = jasmine.createSpyObj('DrawService', ['toggleTool']);

        await TestBed.configureTestingModule({
            declarations: [ToolbarComponent],
            imports: [
                BrowserAnimationsModule,
                HttpClientTestingModule,
                MatDialogModule,
                RouterTestingModule.withRoutes([{ path: 'config', component: ConfigPageComponent }]),
            ],
            providers: [
                { provide: MatDialog, useClass: DialogMock },
                { provide: DrawService, useValue: drawServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ToolbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        compareServiceSpy = jasmine.createSpyObj('CompareService', ['mergeCanvases', 'drawDifferences']);
        component['compareService'] = compareServiceSpy;

        historyServiceSpy = jasmine.createSpyObj('HistoryService', ['undoAction', 'redoAction']);
        component['historyService'] = historyServiceSpy;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('compare method should merge the canvas layers and draws the differences on the difference canvas with the correct precision', () => {
        component.onPrecisionChange(3);
        component.compare();
        expect(component['compareService']['mergeCanvases']).toHaveBeenCalled();
        expect(component['compareService']['drawDifferences']).toHaveBeenCalledWith(3);
    });

    it('precision should be set to 3 by default', () => {
        expect(component.precision).toEqual(3);
    });

    it('onPrecisionChange should not set precision if value did not change', () => {
        const eventValue = new MatSliderChange();
        eventValue.value = 3;
        component.onPrecisionChange(eventValue.value);
        expect(component.precision).toEqual(3);
    });

    it('onPrecisionChange should set precision to the input value', () => {
        const eventValue = new MatSliderChange();
        eventValue.value = 2;
        component.onPrecisionChange(eventValue.value);
        expect(component.precision).toEqual(2);
    });

    it('should toggle the tool in the DrawService when a tool is selected', () => {
        const tool = 'pencil';
        const button = document.querySelector(`#${tool}`)?.parentElement as HTMLButtonElement;
        button.dispatchEvent(new Event('click'));
        expect(component['drawService']['toggleTool']).toHaveBeenCalledWith(tool);
    });

    it('should toggle the tool in the DrawService when a tool is selected', () => {
        spyOn(component['iconContainers'], 'get').and.returnValue(document.createElement('div'));
        const tool = 'pencil';
        const button = document.querySelector(`#${tool}`)?.parentElement as HTMLButtonElement;
        button.dispatchEvent(new Event('click'));
        expect(component['drawService']['toggleTool']).toHaveBeenCalledWith(tool);
    });

    it('should change the color of the pencil when a color is selected', () => {
        const event = new Event('change');
        Object.defineProperty(event, 'target', { writable: false, value: { value: '#ffffff' } });
        component.changePencilColor(event);
        expect(Tool.drawColor).toEqual('#ffffff');
    });

    it('should change the width of the pencil when a width is selected', () => {
        const event = new Event('change');
        Object.defineProperty(event, 'target', { writable: false, value: { value: '3' } });
        component.changePencilWidth(event);
        expect(Tool.drawWidth).toEqual(3);
    });

    it('should change the color of the rectangle when a color is selected', () => {
        const event = new Event('change');
        Object.defineProperty(event, 'target', { writable: false, value: { value: '#ffffff' } });
        component.changeRectangleColor(event);
        expect(Tool.rectangleColor).toEqual('#ffffff');
    });

    it('should change the width of the eraser when a width is selected', () => {
        const event = new Event('change');
        Object.defineProperty(event, 'target', { writable: false, value: { value: '3' } });
        component.changeEraserWidth(event);
        expect(Tool.eraserWidth).toEqual(3);
    });

    it('undoAction method should call the undoAction method of the HistoryService', () => {
        component.undoAction();
        expect(component['historyService']['undoAction']).toHaveBeenCalled();
    });

    it('redoAction method should call the redoAction method of the HistoryService', () => {
        component.redoAction();
        expect(component['historyService']['redoAction']).toHaveBeenCalled();
    });
});
