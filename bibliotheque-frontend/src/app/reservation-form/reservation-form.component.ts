import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Books } from '../_model/books';
import { Users } from '../_model/users';

@Component({
  selector: 'app-reservation-form',
  standalone: false,
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent {

  @Input() books: Books[] = [];
  @Input() users: Users[] = [];
  @Input() submitting = false;
  @Output() submitForm = new EventEmitter<{ livreId: number; adherentId: number }>();

  livreId: number | null = null;
  adherentId: number | null = null;

  get isFormValid(): boolean {
    return this.livreId !== null && this.adherentId !== null;
  }

  onSubmit() {
    if (this.isFormValid && this.livreId !== null && this.adherentId !== null) {
      this.submitForm.emit({
        livreId: this.livreId,
        adherentId: this.adherentId
      });
    }
  }
}
