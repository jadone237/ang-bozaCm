import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { RapportGlobalDTO } from '../model/rapport.model';

@Injectable({
  providedIn: 'root'
})
export class RapportService {
  // Ajuste l'URL selon la route exacte configurée dans ton backend (ex: /api/v1/rapports ou /api/v1/stats/global)
  private readonly apiUrl = 'http://localhost:8080/api/v1/rapport';

  constructor(private http: HttpClient) {}

  /**
   * Récupère le rapport statistique global de la plateforme
   */
  getRapportGlobal(): Observable<RapportGlobalDTO> {
    return this.http.get<RapportGlobalDTO>(`${this.apiUrl}/global`).pipe(
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