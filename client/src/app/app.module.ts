import { ScrollingModule } from '@angular/cdk/scrolling';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GameSheetComponent } from '@app/components/game-sheet/game-sheet.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { CreationComponent } from '@app/pages/creation-page/creation.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { AbandonPopUpComponent } from './components/abandon-pop-up/abandon-pop-up.component';
import { BackgroundImageComponent } from './components/background-image/background-image.component';
import { ChatComponent } from './components/chat/chat.component';
import { ComparePopupComponent } from './components/creation-page/compare-popup/compare-popup.component';
import { CustomSliderComponent } from './components/creation-page/custom-slider/custom-slider.component';
import { DownloadButtonComponent } from './components/creation-page/download-button/download-button.component';
import { GoBackComponent } from './components/creation-page/go-back/go-back.component';
import { ImageInputComponent } from './components/creation-page/image-input/image-input.component';
import { TitleComponent } from './components/creation-page/title/title.component';
import { ToolbarComponent } from './components/creation-page/toolbar/toolbar.component';
import { VerticalToolbarComponent } from './components/creation-page/vertical-toolbar/vertical-toolbar.component';
import { DifferenceCounterComponent } from './components/difference-counter/difference-counter.component';
import { EndReplayComponent } from './components/end-replay/end-replay.component';
import { EndgamePopUpComponent } from './components/endgame-pop-up/endgame-pop-up.component';
import { GameInfoComponent } from './components/game-info/game-info.component';
import { GameComponent } from './components/game/game.component';
import { HistoryListComponent } from './components/history-list/history-list.component';
import { JoinRequestPopupComponent } from './components/join-request-popup/join-request-popup.component';
import { LimitedTimePopupComponent } from './components/limited-time-popup/limited-time-popup.component';
import { MessageComponent } from './components/message/message.component';
import { PlayButtonsComponent } from './components/play-buttons/play-buttons.component';
import { PlaybackOptionsComponent } from './components/playback-options/playback-options.component';
import { ProgressCounterComponent } from './components/progress-counter/progress-counter.component';
import { TimerComponent } from './components/timer/timer.component';
import { UsernamePopUpComponent } from './components/username-pop-up/username-pop-up.component';
import { WaitingRoomPopupComponent } from './components/waiting-room-popup-component/waiting-room-popup-component.component';
import { ConfigPageComponent } from './pages/config-page/config-page.component';
import { HistoryPageComponent } from './pages/history-page/history-page.component';
import { SelectionPageComponent } from './pages/selection-page/game-selection.component';
/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */

@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        PlayAreaComponent,
        TimerComponent,
        GameComponent,
        GameInfoComponent,
        GameSheetComponent,
        SelectionPageComponent,
        ConfigPageComponent,
        BackgroundImageComponent,
        CreationComponent,
        ImageInputComponent,
        TitleComponent,
        GoBackComponent,
        DownloadButtonComponent,
        CustomSliderComponent,
        ComparePopupComponent,
        AbandonPopUpComponent,
        EndgamePopUpComponent,
        UsernamePopUpComponent,
        ToolbarComponent,
        VerticalToolbarComponent,
        WaitingRoomPopupComponent,
        JoinRequestPopupComponent,
        PlayButtonsComponent,
        ChatComponent,
        MessageComponent,
        DifferenceCounterComponent,
        PlaybackOptionsComponent,
        EndReplayComponent,
        HistoryPageComponent,
        ProgressCounterComponent,
        LimitedTimePopupComponent,
        HistoryListComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ScrollingModule,
        ReactiveFormsModule,
    ],
    providers: [HttpClientModule],
    bootstrap: [AppComponent],
})
export class AppModule {}
