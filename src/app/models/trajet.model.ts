export interface TrajetRequestDTO {
  depart: string;
  arrivee: string;
}

export interface TrajetResponseDTO {
  id: number;
  depart: string;
  arrivee: string;
  type?: string;
  duree?: string;
}

export interface PageResponseDTO<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
