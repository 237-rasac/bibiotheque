import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';

import { ReservationListComponent } from './reservation-list.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { Reservation } from '../_model/reservation';

describe('ReservationListComponent', () => {
  let component: ReservationListComponent;
  let fixture: ComponentFixture<ReservationListComponent>;

  const makeReservation = (overrides: Partial<Reservation> = {}): Reservation =>
    ({
      reservationId: 1,
      livreId: 10,
      livreName: 'Livre A',
      adherentId: 100,
      adherentName: 'Alice',
      dateReservation: '2026-09-01',
      dateExpiration: '2026-09-10',
      statut: 'EN_ATTENTE',
      ...overrides
    } as Reservation);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // The list template renders app-confirm-modal and uses routerLink + ngModel.
      declarations: [ReservationListComponent, ConfirmModalComponent],
      imports: [RouterTestingModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationListComponent);
    component = fixture.componentInstance;
  });

  describe('cancelling setter', () => {
    it('should default to false', () => {
      expect(component.cancelling).toBeFalse();
    });

    it('should expose the value it was set to', () => {
      component.cancelling = true;
      expect(component.cancelling).toBeTrue();

      component.cancelling = false;
      expect(component.cancelling).toBeFalse();
    });

    it('should close the modal and clear the pending reservation when it flips from true to false', () => {
      // Simulate a cancel in progress (parent sets [cancelling]="true").
      component.openCancelModal(makeReservation());
      component.cancelling = true;
      expect(component.showCancelModal).toBeTrue();

      // Parent flips cancelling back to false once the PATCH settles.
      component.cancelling = false;

      expect(component.showCancelModal).toBeFalse();
      expect(component.reservationToCancel).toBeNull();
    });

    it('should keep the modal open when cancelling is set to true', () => {
      component.openCancelModal(makeReservation());

      component.cancelling = true;

      expect(component.showCancelModal).toBeTrue();
      expect(component.reservationToCancel).toBeTruthy();
    });

    it('should not touch an open modal when set to false without a prior true', () => {
      component.openCancelModal(makeReservation());

      component.cancelling = false;

      // No true -> false transition happened, so the modal stays as-is.
      expect(component.showCancelModal).toBeTrue();
      expect(component.reservationToCancel).toBeTruthy();
    });
  });

  describe('isAnnulable', () => {
    it("should return true for 'EN_ATTENTE'", () => {
      expect(component.isAnnulable('EN_ATTENTE')).toBeTrue();
    });

    it("should return true for 'DISPONIBLE'", () => {
      expect(component.isAnnulable('DISPONIBLE')).toBeTrue();
    });

    (['ANNULEE', 'EXPIREE', 'HONOREE'] as const).forEach(statut => {
      it(`should return false for '${statut}'`, () => {
        expect(component.isAnnulable(statut)).toBeFalse();
      });
    });
  });

  describe('cancel modal flow', () => {
    it('openCancelModal should store the reservation, build details and show the modal', () => {
      const reservation = makeReservation({ reservationId: 42, livreName: 'Clean Code', adherentName: 'Bob', statut: 'DISPONIBLE' });

      component.openCancelModal(reservation);

      expect(component.reservationToCancel).toBe(reservation);
      expect(component.showCancelModal).toBeTrue();
      expect(component.cancelModalDetails).toEqual([
        { label: 'Book', value: 'Clean Code' },
        { label: 'Member', value: 'Bob' },
        { label: 'Status', value: 'DISPONIBLE' }
      ]);
    });

    it('closeCancelModal should close and reset when not cancelling', () => {
      component.openCancelModal(makeReservation());

      component.closeCancelModal();

      expect(component.showCancelModal).toBeFalse();
      expect(component.reservationToCancel).toBeNull();
    });

    it('closeCancelModal should not close while a cancel is in progress', () => {
      component.openCancelModal(makeReservation());
      component.cancelling = true;

      component.closeCancelModal();

      expect(component.showCancelModal).toBeTrue();
      expect(component.reservationToCancel).toBeTruthy();
    });

    it('confirmCancel should emit the pending reservation id', () => {
      let emittedId: number | undefined;
      component.cancel.subscribe(id => (emittedId = id));
      component.openCancelModal(makeReservation({ reservationId: 77 }));

      component.confirmCancel();

      expect(emittedId).toBe(77);
    });

    it('confirmCancel should not emit when no reservation is pending', () => {
      let emitted = false;
      component.cancel.subscribe(() => (emitted = true));
      component.reservationToCancel = null;

      component.confirmCancel();

      expect(emitted).toBeFalse();
    });
  });

  describe('outputs', () => {
    it('onStatutChange should emit the selected statut', () => {
      let emitted: string | undefined;
      component.statutChange.subscribe(statut => (emitted = statut));

      component.onStatutChange('EN_ATTENTE');

      expect(emitted).toBe('EN_ATTENTE');
    });

    it('onRetry should emit', () => {
      let retried = false;
      component.retry.subscribe(() => (retried = true));

      component.onRetry();

      expect(retried).toBeTrue();
    });
  });

  describe('template', () => {
    (['EN_ATTENTE', 'DISPONIBLE'] as const).forEach(statut => {
      it(`should render the Cancel button for '${statut}'`, () => {
        component.reservations = [makeReservation({ statut })];
        fixture.detectChanges();

        const cancelButtons = fixture.nativeElement.querySelectorAll('tbody .ds-btn-outline-danger');
        expect(cancelButtons.length).toBe(1);
      });
    });

    (['ANNULEE', 'EXPIREE', 'HONOREE'] as const).forEach(statut => {
      it(`should not render the Cancel button for '${statut}'`, () => {
        component.reservations = [makeReservation({ statut })];
        fixture.detectChanges();

        const cancelButtons = fixture.nativeElement.querySelectorAll('tbody .ds-btn-outline-danger');
        expect(cancelButtons.length).toBe(0);
      });
    });

    it('should show the error alert with a retry when error is set', () => {
      component.error = 'Backend down';
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('.ds-alert-danger');
      const retryButton = fixture.nativeElement.querySelector('.ds-btn-outline-danger');
      expect(alert.textContent).toContain('Backend down');
      expect(retryButton).toBeTruthy();
    });
  });
});
