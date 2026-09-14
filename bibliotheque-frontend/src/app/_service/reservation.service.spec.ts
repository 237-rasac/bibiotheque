import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReservationService } from './reservation.service';
import { environment } from '../../environments/environment';
import { Reservation } from '../_model/reservation';

/** Mock backend URL, identical to the one built by the service. */
const API_URL = `${environment.apiUrl}/api/reservations`;

describe('ReservationService', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Fails the test if any request was not flushed/expectOne'd.
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getReservations() should GET without statut param when TOUS', () => {
    const mock: any[] = [];

    service.getReservations('TOUS').subscribe(data => {
      expect(data).toEqual(mock);
    });

    const req = httpMock.expectOne(API_URL); // no ?statut=
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('statut')).toBeNull();
    req.flush(mock);
  });

  it('getReservations(EN_ATTENTE) should GET with statut param', () => {
    const mock = [{ reservationId: 1, statut: 'EN_ATTENTE' }];

    service.getReservations('EN_ATTENTE').subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].statut).toBe('EN_ATTENTE');
    });

    const req = httpMock.expectOne(`${API_URL}?statut=EN_ATTENTE`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getReservationById() should GET /api/reservations/:id', () => {
    const mock = { reservationId: 7, statut: 'DISPONIBLE' } as Reservation;

    service.getReservationById(7).subscribe(data => {
      expect(data.reservationId).toBe(7);
    });

    const req = httpMock.expectOne(`${API_URL}/7`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('createReservation() should POST {livreId, adherentId}', () => {
    const mock = { reservationId: 9, livreId: 3, adherentId: 5, statut: 'EN_ATTENTE' } as Reservation;

    service.createReservation(3, 5).subscribe(data => {
      expect(data).toEqual(mock);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ livreId: 3, adherentId: 5 });
    req.flush(mock);
  });

  it('cancelReservation() should PATCH /api/reservations/:id/annuler', () => {
    const mock = { reservationId: 9, statut: 'ANNULEE' } as Reservation;

    service.cancelReservation(9).subscribe(data => {
      expect(data.statut).toBe('ANNULEE');
    });

    const req = httpMock.expectOne(`${API_URL}/9/annuler`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(mock);
  });

  it('deleteReservation() should DELETE /api/reservations/:id', () => {
    service.deleteReservation(4).subscribe(res => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${API_URL}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getExpiredReservations() should GET /api/reservations/expired', () => {
    const mock = [{ reservationId: 2, statut: 'EXPIREE' }];

    service.getExpiredReservations().subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].statut).toBe('EXPIREE');
    });

    const req = httpMock.expectOne(`${API_URL}/expired`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getReservations(adherentId) should add adherentId param', () => {
    service.getReservations('TOUS', 12).subscribe();

    const req = httpMock.expectOne(`${API_URL}?adherentId=12`);
    expect(req.request.params.get('adherentId')).toBe('12');
    req.flush([]);
  });
});
