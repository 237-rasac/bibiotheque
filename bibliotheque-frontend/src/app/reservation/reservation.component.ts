import { Component, OnInit } from '@angular/core';
import { Books } from '../_model/books';
import { Reservation } from '../_model/reservation';
import { Users } from '../_model/users';
import { BooksService } from '../_service/books.service';
import { ReservationService } from '../_service/reservation.service';
import { UsersService } from '../_service/users.service';

@Component({
  selector: 'app-reservation',
  standalone: false,
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ReservationComponent implements OnInit {

  reservations: Reservation[] = [];
  books: Books[] = [];
  users: Users[] = [];

  loading = false;
  error: string | null = null;
  selectedStatut = 'TOUS';

  formSubmitting = false;

  constructor(
    private reservationService: ReservationService,
    private booksService: BooksService,
    private usersService: UsersService
  ) { }

  ngOnInit(): void {
    this.loadReservations();
    this.loadBooks();
    this.loadUsers();
  }

  loadReservations() {
    this.loading = true;
    this.error = null;
    this.reservationService.getReservations(this.selectedStatut).subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        // Toast error déjà affiché par l'interceptor
      }
    });
  }

  loadBooks() {
    this.booksService.getBooksList().subscribe({
      next: (data) => { this.books = data; },
      error: () => { this.books = []; }
    });
  }

  loadUsers() {
    this.usersService.getUsersList().subscribe({
      next: (data) => { this.users = data; },
      error: () => { this.users = []; }
    });
  }

  onStatutChange(statut: string) {
    this.selectedStatut = statut;
    this.loadReservations();
  }

  onRetry() {
    this.loadReservations();
  }

  onCreateReservation(event: { livreId: number; adherentId: number }) {
    this.formSubmitting = true;
    this.reservationService.createReservation(event.livreId, event.adherentId).subscribe({
      next: () => {
        this.formSubmitting = false;
        this.loadReservations();
      },
      error: () => {
        this.formSubmitting = false;
        // Toast error déjà affiché par l'interceptor.
      }
    });
  }

  onAnnuler(id: number) {
    const confirmed = confirm('Êtes-vous sûr de vouloir annuler cette réservation ?');
    if (!confirmed) return;

    this.reservationService.cancelReservation(id).subscribe({
      next: (updated) => {
        const index = this.reservations.findIndex(r => r.reservationId === id);
        if (index !== -1) {
          this.reservations[index] = updated;
        }
      },
      error: () => {
        // Toast error déjà affiché par l'interceptor.
      }
    });
  }
}
