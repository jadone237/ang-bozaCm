import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ⚠️ Forme exacte de la réponse non vérifiée ici (pas d'accès au code du RapportController
// dans cette session) — mentionné comme existant ("GET /api/v1/rapport/global"). Le
// mapping vers les cartes de stats (bookings.component.ts) est défensif : chaque champ
// retombe sur 0 s'il n'est pas trouvé, plutôt que d'afficher une valeur inventée.
export interface RapportGlobal {
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class RapportService {
  private readonly baseUrl = `${environment.apiUrl}/v1/rapport`;

  constructor(private http: HttpClient) {}

  getGlobal(): Observable<RapportGlobal> {
    return this.http.get<RapportGlobal>(`${this.baseUrl}/global`);
  }
}
