import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { fuzz } from 'fuzzing';

import { CommunicationService } from './communication.service';
import { SheetContainerService } from './sheet-container.service';

describe('SheetContainerService Fuzzing', () => {
    let service: SheetContainerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, MatDialogModule],
            providers: [CommunicationService, MatDialog],
        }).compileComponents();
        service = TestBed.inject(SheetContainerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getSheets', async () => {
        const getSheets = async (pageIndex: number) => {
            await new Promise((resolve) => {
                service.getSheets(pageIndex);
                setTimeout(resolve, 500);
            });
        };

        const errors = await fuzz(getSheets).number().errors();
        console.log(errors);
        expect(errors.length).toEqual(0);
    });

    it('deleteSheet', async () => {
        spyOn(window, 'confirm').and.returnValue(true);

        const deleteSheet = async (title: string) => {
            await new Promise((resolve) => {
                service.deleteSheet(title);
                setTimeout(resolve, 500);
            });
        };

        const errors = await fuzz(deleteSheet.bind(service)).string().errors();
        console.log(errors);
        expect(errors.length).toEqual(0);
    });
});
