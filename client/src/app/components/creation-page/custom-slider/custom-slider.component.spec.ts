import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSlider, MatSliderChange } from '@angular/material/slider';
import { SliderConstants } from '@app/constants/constants';
import { AppMaterialModule } from '@app/modules/material.module';

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CustomSliderComponent } from './custom-slider.component';

describe('CustomSliderComponent', () => {
    let component: CustomSliderComponent;
    let fixture: ComponentFixture<CustomSliderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CustomSliderComponent, MatSlider],
            imports: [AppMaterialModule],
            schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(CustomSliderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onInputChange should set stepIndex', () => {
        const sliderEvent = new MatSliderChange();
        sliderEvent.value = 2;
        component.onInputChange(sliderEvent);
        expect(component['stepIndex']).toEqual(2);
    });

    it('onInputChange should emit new value', () => {
        const spy = spyOn(component.newValueEvent, 'emit');
        const sliderEvent = new MatSliderChange();
        sliderEvent.value = SliderConstants.Step3;

        component.onInputChange(sliderEvent);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(SliderConstants.Value3);
    });

    it('onInputChange should return the correct value', () => {
        const sliderEvent = new MatSliderChange();
        sliderEvent.value = SliderConstants.Step3;
        const value = component.onInputChange(sliderEvent);
        expect(value).toEqual(SliderConstants.Value3.toString());
    });

    it('value should have a default value of 3', () => {
        expect(component.value).toEqual(SliderConstants.Step1);
    });
});
