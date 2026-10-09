import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { PageResponseDTO, TrajetRequestDTO, TrajetResponseDTO } from '../models/trajet.model';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class TrajetService {
  private readonly apiUrl = `${environment.apiUrl}/v1/trajets`;

  constructor(private http: HttpClient) {}

  createTrajet(trajet: TrajetRequestDTO): Observable<string> {
    return this.http.post(`${this.apiUrl}/create`, trajet, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  getAllTrajets(): Observable<TrajetResponseDTO[]> {
    return this.http.get<TrajetResponseDTO[]>(`${this.apiUrl}/get_all`).pipe(
      catchError(this.handleError)
    );
  }

  getAllTrajetsPaginated(
    page = 0,
    size = 10,
    sortBy = 'depart'
  ): Observable<PageResponseDTO<TrajetResponseDTO>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy);

    return this.http.get<PageResponseDTO<TrajetResponseDTO>>(
      `${this.apiUrl}/get_all_page`,
      { params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getTrajetById(id: number): Observable<TrajetResponseDTO> {
    return this.http.get<TrajetResponseDTO>(`${this.apiUrl}/get_by_id/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateTrajet(id: number, trajet: TrajetRequestDTO): Observable<string> {
    return this.http.put(`${this.apiUrl}/update/${id}`, trajet, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  deleteTrajet(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  getTrajetsByDepart(depart: string): Observable<TrajetResponseDTO[]> {
    return this.http.get<TrajetResponseDTO[]>(
      `${this.apiUrl}/search/depart/${encodeURIComponent(depart)}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  getTrajetsByRoute(depart: string, arrivee: string): Observable<TrajetResponseDTO[]> {
    return this.http.get<TrajetResponseDTO[]>(
      `${this.apiUrl}/search/route/${encodeURIComponent(depart)}/${encodeURIComponent(arrivee)}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  rechercher(terme: string): Observable<TrajetResponseDTO[]> {
    return this.http.get<TrajetResponseDTO[]>(
      `${this.apiUrl}/search/${encodeURIComponent(terme)}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue sur le serveur.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client : ${error.error.message}`;
    } else {
      // Avec responseType 'text' (création, modification, suppression), le corps d'erreur JSON arrive en texte
      let corps = error.error;
      if (typeof corps === 'string') {
        try { corps = JSON.parse(corps); } catch { /* vrai texte : on le garde tel quel */ }
      }
      const backendMessage = typeof corps === 'string'
        ? corps
        : corps?.message || corps?.error;
      errorMessage = backendMessage || `Erreur ${error.status} : ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
