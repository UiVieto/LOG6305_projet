import { Component, EventEmitter, Output } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { SliderConstants } from '@app/constants/constants';

@Component({
    selector: 'app-custom-slider',
    templateUrl: './custom-slider.component.html',
    styleUrls: ['./custom-slider.component.scss'],
})
export class CustomSliderComponent {
    @Output() newValueEvent: EventEmitter<number>;

    value: number;
    private stepIndex: number;
    private steps: number[];

    /**
     * Sets the initial value of the slider to 3.
     */
    constructor() {
        this.newValueEvent = new EventEmitter<number>();
        this.stepIndex = 1;
        this.value = SliderConstants.Step1;
        this.steps = [SliderConstants.Value0, SliderConstants.Value1, SliderConstants.Value2, SliderConstants.Value3];
    }

    /**
     * Sets the value of the slider when a change triggered by the user is detected.
     *
     * @param $event the event that triggered the change.
     * @returns the value of the slider.
     */
    onInputChange = ($event: MatSliderChange): string => {
        if ($event.value !== null) {
            this.stepIndex = $event.value;
            this.newValueEvent.emit(this.steps[this.stepIndex]);
        }

        return this.steps[this.stepIndex].toString();
    };
}
