import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReservationAdminService {
  constructor(private http: HttpClient) {}

  getClients() {
    return this.http.get<any>(`${environment.apiUrl}/v1/clients/get_all`);
  }

  getOffres() {
    return this.http.get<any[]>(`${environment.apiUrl}/v1/offres/get_all`);
  }

  createBus(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/v1/reservations/bus/create`, payload);
  }

  createTrain(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/v1/reservations/train/create`, payload);
  }

  createAvion(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/v1/reservations/avion/create`, payload);
  }
}
