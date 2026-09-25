import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  OffrePageResponseDTO,
  OffreRequestDTO,
  OffreResponseDTO,
  RechercheOffreDTO
} from '../../models/offre.model';

@Injectable({ providedIn: 'root' })
export class OffreService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/offres';

  constructor(private http: HttpClient) {}

  createOffre(offre: OffreRequestDTO): Observable<string> {
    return this.http.post(`${this.apiUrl}/create`, offre, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  getAllOffres(): Observable<OffreResponseDTO[]> {
    return this.http.get<OffreResponseDTO[]>(`${this.apiUrl}/get_all`).pipe(
      catchError(this.handleError)
    );
  }

  getAllOffresPaginated(page = 0, size = 10, sortBy = 'dateDepart'): Observable<OffrePageResponseDTO> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy);

    return this.http.get<OffrePageResponseDTO>(`${this.apiUrl}/get_all_page`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getOffreById(id: number): Observable<OffreResponseDTO> {
    return this.http.get<OffreResponseDTO>(`${this.apiUrl}/get_by_id/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateOffre(id: number, offre: OffreRequestDTO): Observable<string> {
    return this.http.put(`${this.apiUrl}/update/${id}`, offre, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  deleteOffre(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  rechercherOffres(criteres: RechercheOffreDTO, page = 0, size = 10): Observable<OffrePageResponseDTO> {
    let params = new HttpParams().set('page', page).set('size', size);

    Object.entries(criteres).forEach(([cle, valeur]) => {
      if (valeur !== undefined && valeur !== null && valeur !== '') {
        params = params.set(cle, valeur);
      }
    });

    return this.http.get<OffrePageResponseDTO>(`${this.apiUrl}/recherche`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getOffresByPrixRange(prixMin: number, prixMax: number): Observable<OffreResponseDTO[]> {
    return this.http.get<OffreResponseDTO[]>(
      `${this.apiUrl}/search/prix/${prixMin}/${prixMax}`
    ).pipe(catchError(this.handleError));
  }

  getOffresByAgence(agenceId: number, page = 0, size = 10): Observable<OffrePageResponseDTO> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<OffrePageResponseDTO>(
      `${this.apiUrl}/search/agence/${agenceId}`,
      { params }
    ).pipe(catchError(this.handleError));
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
