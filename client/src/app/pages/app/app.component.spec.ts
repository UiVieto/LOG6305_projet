import { TestBed } from '@angular/core/testing';
import { NavigationStart, Router, RouterEvent } from '@angular/router';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppComponent, browserRefresh } from '@app/pages/app/app.component';
import { Subject } from 'rxjs';

describe('AppComponent', () => {
    let app: AppComponent;
    let router: Router;

    const routerEventsSubject = new Subject<RouterEvent>();

    const routerStub = {
        events: routerEventsSubject.asObservable(),
    };

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [AppRoutingModule],
            declarations: [AppComponent],
            providers: [
                {
                    provide: Router,
                    useValue: routerStub,
                },
            ],
        });
        router = TestBed.inject(Router);

        const fixture = TestBed.createComponent(AppComponent);
        app = fixture.componentInstance;
    });

    it('browserRefresh should be true on refresh', () => {
        app['router'] = router;
        app.ngOnInit();
        expect(browserRefresh).toBeFalsy();

        routerEventsSubject.next(new NavigationStart(1, 'start'));
        app.ngOnInit();
        expect(browserRefresh).toBeTruthy();
    });
});
