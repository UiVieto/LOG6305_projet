import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigPageComponent } from '@app/pages/config-page/config-page.component';
import { CreationComponent } from '@app/pages/creation-page/creation.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { HistoryPageComponent } from '@app/pages/history-page/history-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { SelectionPageComponent } from '@app/pages/selection-page/game-selection.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'config', component: ConfigPageComponent },
    { path: 'creation', component: CreationComponent },
    { path: 'select', component: SelectionPageComponent },
    { path: 'history', component: HistoryPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
