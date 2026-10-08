import { AgenceResponseDTO } from '../../agences/models/agence.model';
import { TrajetResponseDTO } from '../../trajets/models/trajet.model';

/** Mode de transport d'une offre (enum TypeTransport côté backend, obligatoire à la création). */
export type TypeTransport = 'BUS' | 'TRAIN' | 'AVION';

export interface OffreRequestDTO {
  titre: string;
  description: string;
  prix: number;
  dateDepart: string;
  nombrePlaces: number;
  agenceId: number;
  trajetId: number;
  typeTransport: TypeTransport;
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
  typeTransport?: TypeTransport | null;
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
