import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Offre {
  id: number;
  titre: string;
  description: string;
  prix: number;
  dateDepart: string;
  nombrePlaces: number;
  placesDisponibles: number;
  typeTransport?: 'BUS' | 'TRAIN' | 'AVION';
  agence: { id: number; nom: string; [key: string]: any };
  // Champs confirmés via BilletServiceImp.java (backend) : Trajet expose getDepart()/getArrivee()
  // → noms JSON réels probables "depart"/"arrivee". Optionnel : forme exacte de la réponse
  // (présence de "trajet") non confirmée, d'où le fallback défensif dans le template.
  trajet?: { id: number; depart?: string; arrivee?: string; [key: string]: any };
}

@Injectable({ providedIn: 'root' })
export class OffreService {
  private readonly baseUrl = `${environment.apiUrl}/v1/offres`;

  constructor(private http: HttpClient) {}

  // Le backend n'expose (pour l'instant) qu'un get_all, pas de GET /{id}.
  // On récupère donc toute la liste et on filtre côté front.
  // Si un endpoint GET /api/v1/offres/{id} existe, remplacer par un appel direct.
  getAll(): Observable<Offre[]> {
    return this.http.get<Offre[]>(`${this.baseUrl}/get_all`);
  }
}