import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Reservation } from '../_model/reservation';

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
  @Output() statutChange = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<number>();
  @Output() retry = new EventEmitter<void>();

  statuts = ['TOUS', 'EN_ATTENTE', 'DISPONIBLE', 'ANNULEE', 'EXPIREE', 'HONOREE'];

  onStatutChange(statut: string) {
    this.statutChange.emit(statut);
  }

  onAnnuler(id: number) {
    this.cancel.emit(id);
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
