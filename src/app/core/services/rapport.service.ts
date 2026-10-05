import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Miroir de RapportGlobalDTO (backend). GET /api/v1/rapport/global renvoie le DTO
// directement, sans enveloppe ApiResponse.
export interface RapportGlobal {
  totalReservations: number | null;
  totalConfirmees: number | null;
  totalEnAttente: number | null;
  totalAnnulees: number | null;
  tauxConfirmation: number | null;
  chiffreAffairesTotal: number | null;
  offreLaPlusReservee: string | null;
  agenceLaPlusActive: string | null;
  trajetLePlusEmprunte: string | null;
  totalOffres: number | null;
  totalAgences: number | null;
  totalTrajets: number | null;
}

@Injectable({ providedIn: 'root' })
export class RapportService {
  private readonly baseUrl = `${environment.apiUrl}/v1/rapport`;

  constructor(private http: HttpClient) {}

  getGlobal(): Observable<RapportGlobal> {
    return this.http.get<RapportGlobal>(`${this.baseUrl}/global`);
  }
}
