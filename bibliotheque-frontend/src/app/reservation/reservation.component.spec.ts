import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { ReservationComponent } from './reservation.component';
import { ReservationListComponent } from '../reservation-list/reservation-list.component';
import { ReservationFormComponent } from '../reservation-form/reservation-form.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { ReservationService } from '../_service/reservation.service';
import { BooksService } from '../_service/books.service';
import { UsersService } from '../_service/users.service';
import { Reservation } from '../_model/reservation';

describe('ReservationComponent (admin reservations page)', () => {
  let component: ReservationComponent;
  let fixture: ComponentFixture<ReservationComponent>;

  let reservationServiceSpy: jasmine.SpyObj<ReservationService>;
  let booksServiceSpy: jasmine.SpyObj<BooksService>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  const mockReservations: Reservation[] = [
    { reservationId: 1, livreId: 10, livreName: 'Livre A', adherentId: 100, adherentName: 'Alice', dateReservation: '2026-09-01', dateExpiration: '2026-09-10', statut: 'EN_ATTENTE' },
    { reservationId: 2, livreId: 11, livreName: 'Livre B', adherentId: 101, adherentName: 'Bob', dateReservation: '2026-09-02', dateExpiration: '2026-09-12', statut: 'DISPONIBLE' }
  ] as Reservation[];

  beforeEach(async () => {
    reservationServiceSpy = jasmine.createSpyObj('ReservationService', ['getReservations', 'createReservation', 'cancelReservation']);
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBooksList']);
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUsersList']);

    // Default spy behavior: emit a FRESH copy of the mock data on every call.
    // (A plain returnValue would hand the component the same array reference,
    // letting one test's in-place mutation leak into the next.)
    reservationServiceSpy.getReservations.and.callFake(() => of(mockReservations.map(r => ({ ...r })) as Reservation[]));
    booksServiceSpy.getBooksList.and.returnValue(of([]));
    usersServiceSpy.getUsersList.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      // Child components of the reservations page template + the module
      // pieces their templates need (routerLink on rows, ngModel filter).
      declarations: [
        ReservationComponent,
        ReservationListComponent,
        ReservationFormComponent,
        ConfirmModalComponent
      ],
      imports: [RouterTestingModule, FormsModule],
      providers: [
        { provide: ReservationService, useValue: reservationServiceSpy },
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should load reservations, books and users', () => {
    fixture.detectChanges(); // triggers ngOnInit

    expect(reservationServiceSpy.getReservations).toHaveBeenCalledWith('TOUS');
    expect(booksServiceSpy.getBooksList).toHaveBeenCalled();
    expect(usersServiceSpy.getUsersList).toHaveBeenCalled();
    expect(component.reservations).toEqual(mockReservations);
    expect(component.loading).toBeFalse();
  });

  it('onStatutChange should update selectedStatut and re-fetch', () => {
    fixture.detectChanges();

    reservationServiceSpy.getReservations.calls.reset();
    component.onStatutChange('EN_ATTENTE');

    expect(component.selectedStatut).toBe('EN_ATTENTE');
    expect(reservationServiceSpy.getReservations).toHaveBeenCalledWith('EN_ATTENTE');
  });

  it('onCreateReservation should close modal, reset form and reload on success', () => {
    fixture.detectChanges();
    reservationServiceSpy.createReservation.and.returnValue(of({} as Reservation));

    component.showCreateModal = true;
    component.onCreateReservation({ livreId: 10, adherentId: 100 });

    expect(component.formSubmitting).toBeFalse();
    expect(component.showCreateModal).toBeFalse();
    expect(reservationServiceSpy.createReservation).toHaveBeenCalledWith(10, 100);
    // The list is reloaded after creation.
    expect(reservationServiceSpy.getReservations).toHaveBeenCalledTimes(2); // init + reload
  });

  it('onCreateReservation should re-enable the submit button on error', () => {
    fixture.detectChanges();
    reservationServiceSpy.createReservation.and.returnValue(throwError(() => ({ status: 409, message: 'RG-01' })));

    component.onCreateReservation({ livreId: 10, adherentId: 100 });

    expect(component.formSubmitting).toBeFalse();
    // The modal stays open so the user can retry.
    expect(component.showCreateModal).toBeFalse();
  });

  it('onAnnuler should replace the cancelled reservation in place', () => {
    fixture.detectChanges();
    const updated = { ...mockReservations[0], statut: 'ANNULEE' };
    reservationServiceSpy.cancelReservation.and.returnValue(of(updated));

    component.onAnnuler(1);

    expect(component.cancelling).toBeFalse();
    expect(component.reservations[0].statut).toBe('ANNULEE');
    expect(component.reservations.length).toBe(2);
  });

  it('onAnnuler should reset cancelling flag on error', () => {
    fixture.detectChanges();
    reservationServiceSpy.cancelReservation.and.returnValue(throwError(() => ({ status: 409, message: 'RG-05' })));

    component.onAnnuler(1);

    expect(component.cancelling).toBeFalse();
    // List unchanged.
    expect(component.reservations[0].statut).toBe('EN_ATTENTE');
  });

  it('closeCreateModal should not close while submitting', () => {
    fixture.detectChanges();
    component.showCreateModal = true;
    component.formSubmitting = true;

    component.closeCreateModal();

    expect(component.showCreateModal).toBeTrue();
  });

  it('loadReservations should keep loading=false on error', () => {
    reservationServiceSpy.getReservations.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    // Error toast is the interceptor's job — the page must not crash.
    expect(component.reservations).toEqual([]);
  });
});
