import { HttpClientModule } from '@angular/common/http';
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { PlayAreaLayers } from '@app/interfaces/play-area-layers';
import { GameSocketService } from '@app/services/game-socket.service';

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let gameSocketService: GameSocketService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlayAreaComponent],
            imports: [MatDialogModule, HttpClientModule, RouterTestingModule],
        }).compileComponents();
        gameSocketService = TestBed.inject(GameSocketService);
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should have a canvas', () => {
        const canvas = fixture.nativeElement.querySelector('canvas');
        expect(canvas).toBeTruthy();
    });
    it('should return defined PlayAreaLayers', () => {
        const layer: PlayAreaLayers = component.getLayers();
        expect(layer.image).toBeDefined();
        expect(layer.diff).toBeDefined();
    });

    it('should call ctx drawImage', () => {
        const image = new Image();
        const event = new Event('load');
        Object.defineProperty(event, 'target', { writable: false, value: image });
        const imageCtxStub = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage']);
        component['imageCtx'] = imageCtxStub;

        component.drawImage(event);
        expect(imageCtxStub.drawImage).toHaveBeenCalled();
        expect(imageCtxStub.drawImage.calls.mostRecent().args).toEqual([image, 0, 0]);
    });

    it('should call sendClick on mouseHitdetect', () => {
        gameSocketService.sendClick = jasmine.createSpy('sendClick');
        const event: MouseEvent = new MouseEvent('click');
        component.mouseHitDetect(event);
        expect(gameSocketService.sendClick).toHaveBeenCalled();
    });

    it('should change image src', () => {
        const source = 'image';
        component['imageSrc'] = 'image';
        component.ngOnChanges({
            imageSrc: new SimpleChange(null, source, false),
        });
        fixture.detectChanges();
        expect(component['imageElement'].src).toContain(source);
    });
});
