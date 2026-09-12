import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation } from '../_model/reservation';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  // Le contrôleur backend expose /api/reservations (cf. @RequestMapping dans ReservationController)
  private baseURL = `${environment.apiUrl}/api/reservations`;

  constructor(private httpClient: HttpClient) { }

  getReservations(statut?: string, adherentId?: number): Observable<Reservation[]> {
    let params = new HttpParams();
    if (statut && statut !== 'TOUS') {
      params = params.set('statut', statut);
    }
    if (adherentId) {
      params = params.set('adherentId', adherentId.toString());
    }
    return this.httpClient.get<Reservation[]>(`${this.baseURL}`, { params });
  }

  createReservation(livreId: number, adherentId: number): Observable<Reservation> {
    return this.httpClient.post<Reservation>(`${this.baseURL}`, { livreId, adherentId });
  }

  cancelReservation(id: number): Observable<Reservation> {
    return this.httpClient.patch<Reservation>(`${this.baseURL}/${id}/annuler`, {});
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.httpClient.get<Reservation>(`${this.baseURL}/${id}`);
  }

  deleteReservation(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/${id}`);
  }

  getExpiredReservations(): Observable<Reservation[]> {
    return this.httpClient.get<Reservation[]>(`${this.baseURL}/expired`);
  }
}
