import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export type TransportKind = 'BUS' | 'TRAIN' | 'AVION';
export type StatutReservation = 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'COMPLETEE';

export interface ClientProfile {
  idClient: number;
  nom: string;
  prenom: string;
  email: string;
  numeroTelephone: string;
  adresse: string;
}

export interface ClientReservation {
  id: number;
  type: TransportKind;
  depart: string;
  arrivee: string;
  dateDepart: string | null;
  createdAt: string | null;
  prix: number;
  statut: StatutReservation;
  compagnie: string;
  billetNumero: string | null;
}

interface ApiResponse<T> {
  data: T;
}

const SEEN_KEY = 'bozacm-notifs-vues';

@Injectable({ providedIn: 'root' })
export class ClientReservationService {
  client = signal<ClientProfile | null>(null);
  reservations = signal<ClientReservation[]>([]);
  isLoading = signal(false);
  loadError = signal('');

  private seen = signal<string[]>(this.readSeen());

  // Notification = une réservation dont le couple "id:statut" n'a pas encore été vu dans la cloche.
  notifications = computed(() =>
    [...this.reservations()]
      .sort((a, b) => this.time(b.createdAt) - this.time(a.createdAt))
      .slice(0, 5)
      .map((r) => ({ reservation: r, unread: !this.seen().includes(this.key(r)) }))
  );
  unreadCount = computed(() => this.notifications().filter((n) => n.unread).length);

  constructor(private http: HttpClient, private authService: AuthService) {}

  load() {
    const email = this.authService.currentEmail();
    if (!email) return;

    this.isLoading.set(true);
    this.loadError.set('');

    this.http.get<ApiResponse<ClientProfile>>(`${environment.apiUrl}/v1/clients/email/${encodeURIComponent(email)}`).subscribe({
      next: (res) => {
        this.client.set(res.data);
        this.loadReservations(res.data.idClient);
      },
      error: () => {
        this.loadError.set('Impossible de charger votre compte pour le moment.');
        this.isLoading.set(false);
      },
    });
  }

  updateProfile(data: Partial<Pick<ClientProfile, 'nom' | 'prenom' | 'numeroTelephone' | 'adresse'>>) {
    const id = this.client()?.idClient;
    return this.http.put<ApiResponse<ClientProfile>>(`${environment.apiUrl}/v1/clients/update/${id}`, data);
  }

  annuler(r: ClientReservation) {
    const segment = r.type.toLowerCase();
    return this.http.patch(`${environment.apiUrl}/v1/reservations/${segment}/${r.id}/annuler`, {});
  }

  telechargerBillet(numero: string) {
    return this.http.get(`${environment.apiUrl}/v1/billets/pdf/${numero}`, { responseType: 'blob' });
  }

  markNotificationsSeen() {
    const keys = this.notifications().map((n) => this.key(n.reservation));
    const merged = Array.from(new Set([...this.seen(), ...keys]));
    this.seen.set(merged);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(merged));
    } catch {}
  }

  private loadReservations(clientId: number) {
    const base = `${environment.apiUrl}/v1/reservations`;
    const fetchType = (segment: string) =>
      this.http.get<ApiResponse<any[]>>(`${base}/${segment}/client/${clientId}/historique`).pipe(
        catchError(() => of({ data: [] as any[] }))
      );

    forkJoin({ bus: fetchType('bus'), train: fetchType('train'), avion: fetchType('avion') }).subscribe(
      ({ bus, train, avion }) => {
        this.reservations.set([
          ...(bus.data ?? []).map((r) => this.map(r, 'BUS', r.compagnieBus)),
          ...(train.data ?? []).map((r) => this.map(r, 'TRAIN', r.compagnieTrain)),
          ...(avion.data ?? []).map((r) => this.map(r, 'AVION', r.compagnieAerienne)),
        ]);
        this.isLoading.set(false);
      }
    );
  }

  private map(r: any, type: TransportKind, compagnie: string): ClientReservation {
    return {
      id: r.idReservation,
      type,
      depart: r.villeDeDepart ?? '',
      arrivee: r.villeArrivee ?? '',
      dateDepart: r.dateDepart ?? null,
      createdAt: r.createdAt ?? null,
      prix: r.prixReservation ?? 0,
      statut: r.statutReservation,
      compagnie: compagnie ?? '',
      billetNumero: r.billetNumero ?? null,
    };
  }

  private key(r: ClientReservation) {
    return `${r.type}-${r.id}:${r.statut}`;
  }

  private time(value: string | null) {
    return value ? new Date(value).getTime() : 0;
  }

  private readSeen(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
}
