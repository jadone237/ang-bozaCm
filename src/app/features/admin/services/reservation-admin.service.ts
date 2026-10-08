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

  // Pas d'endpoint unifié pour toutes les réservations côté backend : chaque type
  // (bus/train/avion) a son propre contrôleur et son propre chemin get_all.
  getAllBus() {
    return this.http.get<any>(`${environment.apiUrl}/v1/reservations/bus/get_all`);
  }

  getAllTrain() {
    return this.http.get<any>(`${environment.apiUrl}/v1/reservations/train/get_all`);
  }

  getAllAvion() {
    return this.http.get<any>(`${environment.apiUrl}/v1/reservations/avion/get_all`);
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

  // PATCH /v1/reservations/{bus|train|avion}/{id}/confirmer — renvoie la réservation mise à jour.
  confirmer(type: 'BUS' | 'TRAIN' | 'AVION', id: number) {
    return this.http.patch<any>(`${environment.apiUrl}/v1/reservations/${type.toLowerCase()}/${id}/confirmer`, {});
  }

  annuler(type: 'BUS' | 'TRAIN' | 'AVION', id: number) {
    return this.http.patch<any>(`${environment.apiUrl}/v1/reservations/${type.toLowerCase()}/${id}/annuler`, {});
  }

  // La confirmation ne génère pas de billet côté backend : il faut le créer explicitement.
  creerBillet(reservationId: number, clientId: number) {
    return this.http.post<any>(`${environment.apiUrl}/v1/billets/create`, { reservationId, clientId });
  }

  telechargerBillet(numeroBillet: string) {
    return this.http.get(`${environment.apiUrl}/v1/billets/pdf/${numeroBillet}`, { responseType: 'blob' });
  }
}
