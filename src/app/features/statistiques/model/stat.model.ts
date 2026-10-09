// 1. Modèle pour les statistiques détaillées d'une agence
export interface AgenceStatistiqueDTO {
  agenceId: number;
  agenceNom: string;
  agenceEmail: string;
  agenceTelephone: string;
  agenceAdresse: string;
  nombreOffres: number;
  prixMoyen: number;
  prixMin: number;
  prixMax: number;
  nombreReservationsTotal: number;
  nombreReservationsConfirmees: number;
  tauxConfirmation: number;
  chiffreAffaire: number;
  rang: number;
}

// 2. Modèle pour la ressource de classement des agences
export interface AgenceClassementDTO {
  agenceId: number;
  agenceNom: string;
  agenceEmail: string;
  agenceTelephone: string;
  agenceAdresse: string;
  nombreOffres: number;
  prixMoyen: number;
  prixMin: number;
  prixMax: number;
  nombreReservationsTotal: number;
  nombreReservationsConfirmees: number;
  tauxConfirmation: number;
  chiffreAffaire: number;
  rang: number;
}
// 3. Évolution mensuelle d'une agence + taux de remplissage de ses offres
export interface MoisStatistiqueDTO {
  mois: string;            // « 2026-10 »
  reservations: number;
  confirmees: number;
  chiffreAffaire: number;  // FCFA, réservations confirmées
}

export interface EvolutionAgenceDTO {
  mois: MoisStatistiqueDTO[];
  placesTotales: number;
  placesReservees: number;
  tauxRemplissage: number; // en %
}
