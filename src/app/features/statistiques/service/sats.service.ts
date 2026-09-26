import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AgenceClassementDTO, AgenceStatistiqueDTO } from '../model/stat.model';

@Injectable({
  providedIn: 'root'
})
export class SatsService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/agences';

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

  private handleError(error: HttpErrorResponse) {
    let message = 'Une erreur est survenue sur le serveur.';
    if (error.error instanceof ErrorEvent) {
      message = `Erreur client : ${error.error.message}`;
    } else {
      const backendMessage = typeof error.error === 'string'
        ? error.error
        : error.error?.message || error.error?.error;
      message = backendMessage || `Erreur ${error.status} : ${error.message}`;
    }
    return throwError(() => new Error(message));
  }
}