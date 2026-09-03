import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Reservation } from '../_model/reservation';
import { ReservationService } from '../_service/reservation.service';
import { ModalDetail } from '../confirm-modal/confirm-modal.component';

@Component({
  standalone: false,
  selector: 'app-reservation-details',
  templateUrl: './reservation-details.component.html',
  styleUrls: ['./reservation-details.component.css']
})
export class ReservationDetailsComponent implements OnInit {

  reservationId: number = 0;
  reservation: Reservation = new Reservation();
  loading = false;
  error: string | null = null;
  showDeleteModal = false;
  deleting = false;
  deleteModalDetails: ModalDetail[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService
  ) { }

  ngOnInit(): void {
    this.reservationId = this.route.snapshot.params['reservationId'];
    this.loadReservation();
  }

  loadReservation() {
    this.loading = true;
    this.error = null;
    this.reservationService.getReservationById(this.reservationId).subscribe({
      next: (data) => {
        this.reservation = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load reservation details.';
      }
    });
  }

  openDeleteModal() {
    this.deleteModalDetails = [
      { label: 'Book', value: this.reservation.livreName },
      { label: 'Member', value: this.reservation.adherentName },
      { label: 'Status', value: this.reservation.statut },
    ];
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    if (!this.deleting) {
      this.showDeleteModal = false;
    }
  }

  confirmDelete() {
    this.deleting = true;
    this.reservationService.deleteReservation(this.reservationId).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.router.navigate(['/reservations']);
      },
      error: () => {
        this.deleting = false;
        // Toast error already handled by interceptor
      }
    });
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
