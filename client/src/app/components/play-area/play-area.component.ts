import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ImageConstants, MouseButton } from '@app/constants/constants';
import { PlayAreaLayers } from '@app/interfaces/play-area-layers';
import { GameSocketService } from '@app/services/game-socket.service';
@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements AfterViewInit, OnChanges {
    @Input() imageSrc: string;
    @ViewChild('errorLayer') private errorLayerRef: ElementRef<HTMLCanvasElement>;
    @ViewChild('clueLayer') private clueLayerRef: ElementRef<HTMLCanvasElement>;
    @ViewChild('diffLayer') private diffLayerRef: ElementRef<HTMLCanvasElement>;
    @ViewChild('imageLayer') private imageLayerRef: ElementRef<HTMLCanvasElement>;

    width = ImageConstants.DefaultWidth;
    height = ImageConstants.DefaultHeight;

    private errorCtx: CanvasRenderingContext2D;
    private clueCtx: CanvasRenderingContext2D;
    private diffCtx: CanvasRenderingContext2D;
    private imageCtx: CanvasRenderingContext2D;

    private imageElement: HTMLImageElement;

    constructor(private gameSocket: GameSocketService) {
        this.imageElement = new Image();
    }

    ngAfterViewInit(): void {
        this.errorCtx = this.errorLayerRef.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.errorCtx.font = '20px Arial';
        this.errorCtx.fillStyle = 'red';

        this.clueCtx = this.clueLayerRef.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.diffCtx = this.diffLayerRef.nativeElement.getContext('2d') as CanvasRenderingContext2D;

        this.imageCtx = this.imageLayerRef.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.imageElement.onload = this.drawImage;
        this.imageElement.src = this.imageSrc;
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.imageElement.src = changes.imageSrc.currentValue;
    }

    drawImage = (event: Event) => {
        this.imageCtx.drawImage(event.target as HTMLImageElement, 0, 0);
    };

    getLayers(): PlayAreaLayers {
        return { image: this.imageCtx, diff: this.diffCtx, clue: this.clueCtx };
    }

    mouseHitDetect(event: MouseEvent): void {
        if (event.button === MouseButton.Left) this.gameSocket.sendClick({ x: event.offsetX, y: event.offsetY }, this.errorCtx);
    }
}
