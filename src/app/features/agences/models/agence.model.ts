export interface AgenceRequestDTO {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville?: string; // Ajoute les champs selon ton DTO Java si nécessaire
}

export interface AgenceResponseDTO {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville?: string;
}

export interface StatistiquesAgenceDetailDTO {
  // Structure selon ton DTO backend pour le classement/stats
  idAgence?: number;
  nomAgence?: string;
  totalTrajets?: number;
}