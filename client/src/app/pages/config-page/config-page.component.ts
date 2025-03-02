import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SettingsConsts } from '@app/constants/constants';
import { GameSocketService } from '@app/services/game-socket.service';
import { SheetContainerService } from '@app/services/sheet-container.service';

@Component({
    selector: 'app-config-page',
    templateUrl: './config-page.component.html',
    styleUrls: ['./config-page.component.scss'],
})
export class ConfigPageComponent implements OnInit {
    @ViewChild('validate', { read: ElementRef }) validate: ElementRef<HTMLButtonElement>;
    title: string;
    initialTime: number;
    penaltyTime: number;
    bonusTime: number;
    settingsForm: FormGroup;

    constructor(public sheetContainer: SheetContainerService, public gameSocketService: GameSocketService, private formBuilder: FormBuilder) {
        this.title = 'Configuration';
        this.gameSocketService.settingsValue.subscribe((settings) => {
            this.initialTime = settings.initialTime;
            this.penaltyTime = settings.penaltyTime;
            this.bonusTime = settings.bonusTime;
        });
    }

    ngOnInit(): void {
        this.initSettingsform();
        this.sheetContainer.getSheets(0);
    }

    resetTime(gameTitle: string): void {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser le meilleur temps de cette feuille?')) {
            this.gameSocketService.resetTime(gameTitle);
        }
    }

    resetAllBestTimes() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les meilleurs temps?')) {
            this.gameSocketService.resetTime();
        }
    }

    initSettingsform(): void {
        this.settingsForm = this.formBuilder.group({
            initialTimeControl: new FormControl(this.initialTime, [
                Validators.required,
                Validators.min(SettingsConsts.MinCountdown),
                Validators.max(SettingsConsts.MaxCountdown),
                Validators.pattern('^[0-9]*$'),
            ]),
            penaltyTimeControl: new FormControl(this.penaltyTime, [
                Validators.required,
                Validators.min(SettingsConsts.MinIncrement),
                Validators.max(SettingsConsts.MaxIncrement),
                Validators.pattern('^[0-9]*$'),
            ]),
            bonusTimeControl: new FormControl(this.bonusTime, [
                Validators.required,
                Validators.min(SettingsConsts.MinIncrement),
                Validators.max(SettingsConsts.MinCountdown),
                Validators.pattern('^[0-9]*$'),
            ]),
        });
    }

    updateSettings(): void {
        let buttonMessage = this.validate.nativeElement.innerText;
        this.gameSocketService.updateSettings(this.initialTime, this.penaltyTime, this.bonusTime);
        buttonMessage = 'Succès!';
        this.validate.nativeElement.innerText = buttonMessage;
        setTimeout(() => {
            this.validate.nativeElement.innerText = 'Valider';
        }, SettingsConsts.ValidateTimeout);
    }

    resetSettings(): void {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les meilleurs temps?')) {
            this.initialTime = SettingsConsts.DefaultCountDown;
            this.penaltyTime = SettingsConsts.DefaultIncrement;
            this.bonusTime = SettingsConsts.DefaultIncrement;
            this.gameSocketService.updateSettings(SettingsConsts.DefaultCountDown, SettingsConsts.DefaultIncrement, SettingsConsts.DefaultIncrement);
        }
    }
}
