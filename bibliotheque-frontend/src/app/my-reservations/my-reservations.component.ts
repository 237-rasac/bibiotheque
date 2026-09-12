import { Component, OnInit } from '@angular/core';
import { Reservation } from '../_model/reservation';
import { ReservationService } from '../_service/reservation.service';

/**
 * Page "Mes réservations" (ADHERENT) :
 * le backend (RS-05) filtre automatiquement les réservations de l'utilisateur
 * authentifié — le frontend n'a qu'à afficher la liste retournée.
 */
@Component({
  selector: 'app-my-reservations',
  standalone: false,
  templateUrl: './my-reservations.component.html',
  styleUrls: ['./my-reservations.component.css']
})
export class MyReservationsComponent implements OnInit {

  reservations: Reservation[] = [];
  loading = true;
  error: string | null = null;
  selectedStatut = 'TOUS';
  cancelling = false;

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations() {
    this.loading = true;
    this.error = null;
    // Pas d'adherentId : le backend utilise l'identité du JWT (RS-04/RS-05).
    this.reservationService.getReservations(this.selectedStatut).subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger vos réservations.';
      }
    });
  }

  onStatutChange(statut: string) {
    this.selectedStatut = statut;
    this.loadReservations();
  }

  onRetry() {
    this.loadReservations();
  }

  onAnnuler(id: number) {
    this.cancelling = true;
    this.reservationService.cancelReservation(id).subscribe({
      next: (updated) => {
        const index = this.reservations.findIndex(r => r.reservationId === id);
        if (index !== -1) {
          this.reservations[index] = updated;
        }
        this.cancelling = false;
      },
      error: () => {
        this.cancelling = false;
      }
    });
  }
}
