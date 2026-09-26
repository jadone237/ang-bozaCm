import { AgenceResponseDTO } from '../../agences/models/agence.model';
import { TrajetResponseDTO } from '../../trajets/models/trajet.model';

export interface OffreRequestDTO {
  titre: string;
  description: string;
  prix: number;
  dateDepart: string;
  nombrePlaces: number;
  agenceId: number;
  trajetId: number;
}

export interface OffreResponseDTO {
  id: number;
  titre: string;
  description: string;
  prix: number;
  dateDepart: string;
  nombrePlaces: number;
  placesDisponibles: number;
  agence: AgenceResponseDTO;
  trajet: TrajetResponseDTO;
}

export interface OffrePageResponseDTO {
  content: OffreResponseDTO[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}

export interface RechercheOffreDTO {
  villeDepart?: string;
  villeArrivee?: string;
  prixMin?: number;
  prixMax?: number;
  dateDepart?: string;
  agenceId?: number;
}
