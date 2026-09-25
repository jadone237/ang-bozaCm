import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AgenceRequestDTO, AgenceResponseDTO, StatistiquesAgenceDetailDTO } from '../../models/agence.model';

@Injectable({
  providedIn: 'root'
})
export class AgenceService {
  private apiUrl = 'http://localhost:8080/api/v1/agences';

  constructor(private http: HttpClient) {}

  // 1. LIRE TOUT
  getAllAgences(): Observable<AgenceResponseDTO[]> {
    return this.http.get<AgenceResponseDTO[]>(`${this.apiUrl}/get_all`).pipe(
      catchError(this.handleError)
    );
  }

  // 2. LIRE PAR ID
  getAgenceById(id: number): Observable<AgenceResponseDTO> {
    return this.http.get<AgenceResponseDTO>(`${this.apiUrl}/get_by_id/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // 3. CRÉER
  createAgence(agence: AgenceRequestDTO): Observable<string> {
    return this.http.post(`${this.apiUrl}/create`, agence, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  // 4. MODIFIER
  updateAgence(id: number, agence: AgenceRequestDTO): Observable<string> {
    return this.http.put(`${this.apiUrl}/update/${id}`, agence, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  // 5. SUPPRIMER
  deleteAgence(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  // 6. RECHERCHES ET STATISTIQUES
  getAgenceByEmail(email: string): Observable<AgenceResponseDTO> {
    return this.http.get<AgenceResponseDTO>(`${this.apiUrl}/search/email/${email}`).pipe(
      catchError(this.handleError)
    );
  }

  getAgencesByVille(ville: string): Observable<AgenceResponseDTO[]> {
    return this.http.get<AgenceResponseDTO[]>(`${this.apiUrl}/search/ville/${ville}`).pipe(
      catchError(this.handleError)
    );
  }

  rechercher(terme: string): Observable<AgenceResponseDTO[]> {
    return this.http.get<AgenceResponseDTO[]>(`${this.apiUrl}/rechercher`, {
      params: { terme }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getClassementAgences(): Observable<StatistiquesAgenceDetailDTO[]> {
    return this.http.get<StatistiquesAgenceDetailDTO[]>(`${this.apiUrl}/classement`).pipe(
      catchError(this.handleError)
    );
  }

  getStatistiquesAgence(id: number): Observable<StatistiquesAgenceDetailDTO> {
    return this.http.get<StatistiquesAgenceDetailDTO>(`${this.apiUrl}/statistiques/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // --- Gestion centralisée des erreurs HTTP ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue sur le serveur.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client : ${error.error.message}`;
    } else {
      const backendMessage = typeof error.error === 'string'
        ? error.error
        : error.error?.message || error.error?.error;
      errorMessage = backendMessage
        ? `${backendMessage}`
        : `Erreur ${error.status} : ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}