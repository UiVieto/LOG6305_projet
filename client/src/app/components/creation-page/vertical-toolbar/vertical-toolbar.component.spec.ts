import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolbarComponent } from '@app/components/creation-page/toolbar/toolbar.component';

import { VerticalToolbarComponent } from './vertical-toolbar.component';

describe('VerticalToolbarComponent', () => {
    let component: VerticalToolbarComponent;
    let fixture: ComponentFixture<VerticalToolbarComponent>;

    let toolbarStub: jasmine.SpyObj<ToolbarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VerticalToolbarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(VerticalToolbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        toolbarStub = jasmine.createSpyObj('ToolbarComponent', ['toolbar']);
        toolbarStub.toolbar = { nativeElement: { style: { display: 'flex' } } };
        component.toolbarRef = toolbarStub;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call swapOverlays method when swap button is clicked', () => {
        const spy = spyOn(component, 'swapOverlays');
        const button = fixture.debugElement.nativeElement.querySelector('#swap');
        button.click();
        expect(spy).toHaveBeenCalled();
    });

    it('should call ths swapOverlays method of the drawService when swap button is clicked', () => {
        const spy = spyOn(component['canvasManagerService'], 'swapOverlays');
        const button = fixture.debugElement.nativeElement.querySelector('#swap');
        button.click();
        expect(spy).toHaveBeenCalled();
    });

    it('should call duplicate method when either duplicate button is clicked', () => {
        const spy = spyOn(component, 'duplicate');
        const button1 = fixture.debugElement.nativeElement.querySelector('#duplicate-left');
        const button2 = fixture.debugElement.nativeElement.querySelector('#duplicate-right');
        button1.click();
        expect(spy).toHaveBeenCalled();
        button2.click();
        expect(spy).toHaveBeenCalled();
    });

    it('should call the duplicate method of the drawService when duplicate button is clicked with the correct side', () => {
        const spy = spyOn(component['canvasManagerService'], 'duplicate');
        const button1 = fixture.debugElement.nativeElement.querySelector('#duplicate-left');
        const button2 = fixture.debugElement.nativeElement.querySelector('#duplicate-right');
        button1.click();
        expect(spy).toHaveBeenCalledWith('toLeft');
        button2.click();
        expect(spy).toHaveBeenCalledWith('toRight');
    });
});
