import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { RapportGlobalDTO } from '../model/rapport.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RapportService {
  // Ajuste l'URL selon la route exacte configurée dans ton backend (ex: /api/v1/rapports ou /api/v1/stats/global)
  private readonly apiUrl = `${environment.apiUrl}/v1/rapport`;

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
    let message: string;
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
      message = `Erreur HTTP ${error.status} sur ${error.url || 'le service de rapport'} : ${backendMessage || error.message}`;
    }
    return throwError(() => new Error(message));
  }
}