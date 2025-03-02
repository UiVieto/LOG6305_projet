import { Injectable } from '@angular/core';
@Injectable({
    providedIn: 'root',
})
export class TestLayersHelper {
    static createLayers(left: boolean) {
        const dimension = left ? 1 : 2;

        const layers = {
            image: jasmine.createSpyObj('CanvasRenderingContext2D', ['getImageData', 'drawImage'], ['canvas']),
            diff: jasmine.createSpyObj('CanvasRenderingContext2D', ['fillRect', 'clearRect']),
            clue: jasmine.createSpyObj('CanvasRenderingContext2D', ['canvas', 'clearRect', 'fillRect', 'fillStyle']),
        };
        const leftImage = document.createElement('canvas');
        leftImage.width = dimension;
        leftImage.height = dimension;
        Object.defineProperty(layers.image, 'canvas', {
            get: () => {
                return leftImage;
            },
        });

        return layers;
    }
}
