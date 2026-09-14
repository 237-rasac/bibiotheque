import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ReservationDetailsComponent } from './reservation-details.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { ReservationService } from '../_service/reservation.service';
import { Reservation } from '../_model/reservation';

describe('ReservationDetailsComponent', () => {
  let component: ReservationDetailsComponent;
  let fixture: ComponentFixture<ReservationDetailsComponent>;

  let reservationServiceSpy: jasmine.SpyObj<ReservationService>;
  let router: Router;

  const mockReservation: Reservation = {
    reservationId: 42,
    livreId: 10,
    livreName: 'Livre A',
    adherentId: 100,
    adherentName: 'Alice',
    dateReservation: '2026-09-01',
    dateExpiration: '2026-09-10',
    statut: 'EN_ATTENTE'
  } as Reservation;

  beforeEach(async () => {
    reservationServiceSpy = jasmine.createSpyObj('ReservationService', ['getReservationById', 'deleteReservation']);

    await TestBed.configureTestingModule({
      // ConfirmModal is a child of the details template; RouterTestingModule
      // provides the real Router needed by the routerLink directives.
      declarations: [ReservationDetailsComponent, ConfirmModalComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: ReservationService, useValue: reservationServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { reservationId: 42 } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationDetailsComponent);
    component = fixture.componentInstance;

    // Spy on the real Router so assertions on navigate() still work.
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should create', () => {
    reservationServiceSpy.getReservationById.and.returnValue(of(mockReservation));
    expect(component).toBeTruthy();
  });

  it('ngOnInit should load the reservation matching the route param', () => {
    reservationServiceSpy.getReservationById.and.returnValue(of(mockReservation));
    fixture.detectChanges();

    expect(reservationServiceSpy.getReservationById).toHaveBeenCalledWith(42);
    expect(component.reservation.livreName).toBe('Livre A');
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should display the backend error message on load failure', () => {
    reservationServiceSpy.getReservationById.and.returnValue(
      throwError(() => ({ status: 404, message: 'Réservation introuvable.' }))
    );
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Réservation introuvable.');
  });

  it('openDeleteModal should fill the modal details from the reservation', () => {
    reservationServiceSpy.getReservationById.and.returnValue(of(mockReservation));
    fixture.detectChanges();

    component.openDeleteModal();

    expect(component.showDeleteModal).toBeTrue();
    expect(component.deleteModalDetails).toEqual([
      { label: 'Book', value: 'Livre A' },
      { label: 'Member', value: 'Alice' },
      { label: 'Status', value: 'EN_ATTENTE' }
    ]);
  });

  it('confirmDelete should navigate back to /reservations on success', () => {
    reservationServiceSpy.getReservationById.and.returnValue(of(mockReservation));
    reservationServiceSpy.deleteReservation.and.returnValue(of(void 0));
    fixture.detectChanges();

    component.confirmDelete();

    expect(reservationServiceSpy.deleteReservation).toHaveBeenCalledWith(42);
    expect(component.deleting).toBeFalse();
    expect(component.showDeleteModal).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/reservations']);
  });

  it('confirmDelete should stay on the page on error', () => {
    reservationServiceSpy.getReservationById.and.returnValue(of(mockReservation));
    reservationServiceSpy.deleteReservation.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();

    component.confirmDelete();

    expect(component.deleting).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('formatDate should render a french dd/mm/yyyy date', () => {
    expect(component.formatDate('2026-09-01')).toBe('01/09/2026');
    expect(component.formatDate('')).toBe('');
  });
});
