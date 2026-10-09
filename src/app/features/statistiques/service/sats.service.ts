import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AgenceClassementDTO, AgenceStatistiqueDTO, EvolutionAgenceDTO } from '../model/stat.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SatsService {
  private readonly apiUrl = `${environment.apiUrl}/v1/agences`;

  constructor(private http: HttpClient) {}

  /**
   * Endpoint 1 : Récupère les statistiques détaillées d'une agence spécifique par son ID
   * GET /api/v1/agences/{agenceId}/stats
   */
  getStatistiquesByAgenceId(agenceId: number): Observable<AgenceStatistiqueDTO> {
    return this.http.get<AgenceStatistiqueDTO>(`${this.apiUrl}/statistiques/${agenceId}`).pipe(
      catchError(this.handleError)
    );
  }

  
  getClassementAgences(): Observable<AgenceStatistiqueDTO[]> {
    return this.http.get<AgenceStatistiqueDTO[]>(`${this.apiUrl}/classement`).pipe(
      catchError(this.handleError)
    );
  }

  /** Réservations et CA des derniers mois + taux de remplissage des offres de l'agence. */
  getEvolutionAgence(agenceId: number, mois = 6): Observable<EvolutionAgenceDTO> {
    return this.http.get<EvolutionAgenceDTO>(`${this.apiUrl}/statistiques/${agenceId}/evolution`, {
      params: { mois }
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Une erreur est survenue sur le serveur.';
    if (error.error instanceof ErrorEvent) {
      message = `Erreur client : ${error.error.message}`;
    } else {
      // Avec responseType 'text' (création, modification, suppression), le corps d'erreur JSON arrive en texte
      let corps = error.error;
      if (typeof corps === 'string') {
        try { corps = JSON.parse(corps); } catch { /* vrai texte : on le garde tel quel */ }
      }
      const backendMessage = typeof corps === 'string'
        ? corps
        : corps?.message || corps?.error;
      message = backendMessage || `Erreur ${error.status} : ${error.message}`;
    }
    return throwError(() => new Error(message));
  }
}