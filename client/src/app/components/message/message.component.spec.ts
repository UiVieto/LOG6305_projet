import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Message } from '@common/message';
import { MessageComponent } from './message.component';

describe('MessageComponent', () => {
    let component: MessageComponent;
    let fixture: ComponentFixture<MessageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MessageComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageComponent);
        component = fixture.componentInstance;

        component.message = { sender: 'user', text: 'test' } as Message;
        component.color = '#F0F81E';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set class sent if color is #F0F81E', () => {
        component.color = '#F0F81E';
        expect(component.messageElement.nativeElement.classList).toContain('sent');
    });
});
