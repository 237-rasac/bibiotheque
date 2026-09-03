import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Reservation } from '../_model/reservation';
import { ModalDetail } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-reservation-list',
  standalone: false,
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css']
})
export class ReservationListComponent {

  @Input() reservations: Reservation[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() selectedStatut = 'TOUS';
  private _cancelling = false;
  @Input()
  set cancelling(value: boolean) {
    const wasCancelling = this._cancelling;
    this._cancelling = value;
    if (wasCancelling && !value) {
      this.showCancelModal = false;
      this.reservationToCancel = null;
    }
  }
  get cancelling(): boolean {
    return this._cancelling;
  }
  @Output() statutChange = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<number>();
  @Output() retry = new EventEmitter<void>();

  statuts = ['TOUS', 'EN_ATTENTE', 'DISPONIBLE', 'ANNULEE', 'EXPIREE', 'HONOREE'];

  showCancelModal = false;
  reservationToCancel: Reservation | null = null;
  cancelModalDetails: ModalDetail[] = [];

  onStatutChange(statut: string) {
    this.statutChange.emit(statut);
  }

  openCancelModal(reservation: Reservation) {
    this.reservationToCancel = reservation;
    this.cancelModalDetails = [
      { label: 'Book', value: reservation.livreName },
      { label: 'Member', value: reservation.adherentName },
      { label: 'Status', value: reservation.statut },
    ];
    this.showCancelModal = true;
  }

  closeCancelModal() {
    if (!this.cancelling) {
      this.showCancelModal = false;
      this.reservationToCancel = null;
    }
  }

  confirmCancel() {
    if (this.reservationToCancel) {
      this.cancel.emit(this.reservationToCancel.reservationId);
    }
  }

  onRetry() {
    this.retry.emit();
  }

  isAnnulable(statut: string): boolean {
    return statut === 'EN_ATTENTE' || statut === 'DISPONIBLE';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
