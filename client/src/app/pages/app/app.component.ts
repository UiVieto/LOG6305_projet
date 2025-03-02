import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';
export let browserRefresh = false;
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy, OnInit {
    subscription: Subscription;
    constructor(private router: Router) {}

    ngOnInit() {
        this.subscription = this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                browserRefresh = !this.router.navigated;
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
