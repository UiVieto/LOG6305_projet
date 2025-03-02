import { Injectable } from '@angular/core';
@Injectable({
    providedIn: 'root',
})
export class TestFilesHelper {
    static async createFile(fileName: string): Promise<File> {
        const imgUrl = await fetch('/base/src/assets/compare_service_test_assets/' + fileName);
        const buffer = await imgUrl.arrayBuffer();
        return new File([buffer], fileName, { type: 'image/' + fileName.split('.')[1] });
    }
}
