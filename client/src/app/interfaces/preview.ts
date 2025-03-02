import { PreviewWithoutImage1 } from '@common/preview';
import { Observable } from 'rxjs';
export interface Preview extends PreviewWithoutImage1 {
    image1: Observable<string>;
}
