export interface TrajetRequestDTO {
  villeDepart: string;
  villeArrivee: string;
  duree: string;
}

export interface TrajetResponseDTO {
  id: number;
  villeDepart: string;
  villeArrivee: string;
  duree: string;
}

export interface PageResponseDTO<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
