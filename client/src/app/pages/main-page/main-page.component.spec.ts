import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BackgroundImageComponent } from '@app/components/background-image/background-image.component';
import { WaitingRoomPopupComponent } from '@app/components/waiting-room-popup-component/waiting-room-popup-component.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { CommunicationService } from '@app/services/communication.service';
import { GameSocketService } from '@app/services/game-socket.service';
import { SheetContainerService } from '@app/services/sheet-container.service';
import { of } from 'rxjs';
import SpyObj = jasmine.SpyObj;

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let sheetContainerServiceSpy: SpyObj<SheetContainerService>;
    let gameSocketService: GameSocketService;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        communicationServiceSpy = jasmine.createSpyObj('communicationSpy', ['getGames']);
        sheetContainerServiceSpy = jasmine.createSpyObj('sheetContainerSpy', ['isFirstPage', 'isLastPage', 'getSheets']);
        await TestBed.configureTestingModule({
            declarations: [MainPageComponent, BackgroundImageComponent],
            imports: [RouterTestingModule, HttpClientModule],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: SheetContainerService, useValue: sheetContainerServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        gameSocketService = TestBed.inject(GameSocketService);
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it("should have as title 'Jeu des différences'", () => {
        expect(component.title).toEqual('Jeu des différences');
    });

    it('should have a "Mode Classique" button', () => {
        const classicButton = document.getElementById('classic-button');
        expect(classicButton).not.toBeNull();
        expect(classicButton?.textContent).not.toBeNull();
        expect(classicButton?.textContent).toEqual('Mode Classique');
    });

    it('should have a "Mode Temps Limité" button', () => {
        const limitedTimeButton = document.getElementById('limited-time-button');
        expect(limitedTimeButton).not.toBeNull();
        expect(limitedTimeButton?.textContent).not.toBeNull();
        expect(limitedTimeButton?.textContent).toEqual('Mode Temps Limité');
    });

    it('should have a Classic Mode button', () => {
        const configurationButton = document.getElementById('configuration-button');
        expect(configurationButton).not.toBeNull();
        expect(configurationButton?.textContent).not.toBeNull();
        expect(configurationButton?.textContent).toEqual('Configuration');
    });

    it('should have a logo', () => {
        const logo = document.getElementById('logo');
        expect(logo).not.toBeNull();
    });

    it('should have a footer with the correct information', () => {
        const footer = document.getElementsByClassName('footer-item');
        expect(footer).not.toBeNull();

        const teamName = document.getElementsByClassName('team-name')[0];
        expect(teamName?.textContent).toEqual('Équipe 308');

        const teammates: string[] = [];
        document.getElementById('teammate-names')?.childNodes.forEach((childNode) => {
            if (childNode.textContent !== ', ' && childNode.textContent !== null) {
                teammates.push(childNode.textContent);
            }
        });

        const teammateNames = ['Gabriel Sawka', 'Huy Viet Nguyen', 'Benjamin Piché', 'Edouard Marsolais', 'Thomas Thiboutot', 'Matteo Colavita'];
        for (let i = 0; i < teammates.length; i++) {
            expect(teammates).toContain(teammateNames[i]);
        }
    });
    it('should call the createGameLimitedTime method and open the waiting room popup for Coop mode', () => {
        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        const waitingRoomDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of({ username: 'test', mode: 'Coop' }));
        waitingRoomDialogRefSpy.afterClosed.and.returnValue(of(null));
        dialogSpy.open.and.returnValues(dialogRefSpy, waitingRoomDialogRefSpy);

        spyOn(gameSocketService, 'createGameLimitedTime');
        spyOn(gameSocketService.socketService, 'send');

        component.openLimitedTimePopup();

        expect(gameSocketService.createGameLimitedTime).toHaveBeenCalledWith('test', 'Coop');
        expect(dialogRefSpy.afterClosed).toHaveBeenCalled();
        expect(dialogSpy.open).toHaveBeenCalledWith(WaitingRoomPopupComponent, {
            width: '20%',
            data: { gameTitle: 'Mode temps limité', prompt: "En attente d'un joueur." },
            disableClose: true,
            panelClass: 'container',
            autoFocus: false,
        });
        expect(waitingRoomDialogRefSpy.afterClosed).toHaveBeenCalled();
        expect(gameSocketService.socketService.send).toHaveBeenCalledWith('cancelWaitingRoom');
    });
});
