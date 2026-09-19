import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationFormComponent } from './reservation-form.component';
import { Books } from '../_model/books';
import { Users } from '../_model/users';

describe('ReservationFormComponent', () => {
  let component: ReservationFormComponent;
  let fixture: ComponentFixture<ReservationFormComponent>;

  const mockBooks: Books[] = [{ bookId: 1, bookName: 'Livre A', bookAuthor: '', bookGenre: '', noOfCopies: 1 } as Books];
  const mockUsers: Users[] = [{ userId: 2, username: 'alice', name: 'Alice', password: '', role: [] } as Users];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReservationFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid until both book and member are selected', () => {
    expect(component.isFormValid).toBeFalse();

    component.livreId = 1;
    expect(component.isFormValid).toBeFalse();

    component.adherentId = 2;
    expect(component.isFormValid).toBeTrue();
  });

  it('onSubmit should not emit when the form is invalid', () => {
    const emitted: Array<{ livreId: number; adherentId: number }> = [];
    component.submitForm.subscribe(v => emitted.push(v));

    component.livreId = null;
    component.adherentId = 2;
    component.onSubmit();

    expect(emitted.length).toBe(0);
  });

  it('onSubmit should emit {livreId, adherentId} when valid', () => {
    const emitted: Array<{ livreId: number; adherentId: number }> = [];
    component.submitForm.subscribe(v => emitted.push(v));

    component.livreId = 1;
    component.adherentId = 2;
    component.onSubmit();

    expect(emitted).toEqual([{ livreId: 1, adherentId: 2 }]);
  });

  it('reset() should clear both selections', () => {
    component.livreId = 1;
    component.adherentId = 2;
    component.reset();

    expect(component.livreId).toBeNull();
    expect(component.adherentId).toBeNull();
    expect(component.isFormValid).toBeFalse();
  });
});
