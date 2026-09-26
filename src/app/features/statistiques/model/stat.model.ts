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