import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GoBackComponent } from './go-back.component';

describe('GoBackComponent', () => {
    let component: GoBackComponent;
    let fixture: ComponentFixture<GoBackComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GoBackComponent],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(GoBackComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
