import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation } from '../_model/reservation';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private baseURL = `${environment.apiUrl}/reservations`;

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
}
