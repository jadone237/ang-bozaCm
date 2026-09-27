import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservationAdminService } from '../../services/reservation-admin.service';
import { RapportService } from '../../../../core/services/rapport.service';
import { AuthService } from '../../../../core/auth/auth.service';

interface StatCard {
  icon: string; iconBg: string; iconColor: string;
  label: string; value: string; valueColor: string;
  subtitle: string; subtitleColor: string;
}

interface Reservation {
  initiales: string; avatarBg: string; nom: string; offre: string;
  typeIcon: string; typeLabel: string; date: string;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'ANNULEE';
}

const AVATAR_COLORS = ['#c7d2fe', '#a7f3d0', '#fbcfe8', '#fde68a', '#bfdbfe'];

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.css',
})
export class BookingsComponent implements OnInit {
  statutFilter = signal('Tous statuts');
  typeFilter = signal('Tous types');

  showModal = signal(false);
  isSubmitting = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);
  typeTransport = signal<'BUS' | 'TRAIN' | 'AVION'>('BUS');

  clients = signal<any[]>([]);
  offres = signal<any[]>([]);

  busForm: FormGroup;
  trainForm: FormGroup;
  avionForm: FormGroup;

  // Plus aucune donnée en dur : les stats et le tableau ne s'affichent que si le
  // backend répond réellement (voir ngOnInit). Vide/zéro tant qu'il n'y a rien à charger.
  stats = signal<StatCard[]>([]);
  isLoadingStats = signal(true);
  statsError = signal('');

  reservations = signal<Reservation[]>([]);
  isLoadingReservations = signal(true);
  reservationsError = signal('');

  // Filtrage client-side sur les données affichées (le tableau reste en dur, cf. limite déjà connue).
  filteredReservations = computed(() => {
    const statut = this.statutFilter();
    const type = this.typeFilter();

    return this.reservations().filter((r) => {
      const matchStatut = statut === 'Tous statuts' || this.badgeLabel(r.statut).toLowerCase() === statut.toLowerCase();
      const matchType = type === 'Tous types' || r.typeLabel.toLowerCase() === type.toLowerCase();
      return matchStatut && matchType;
    });
  });

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationAdminService,
    private rapportService: RapportService,
    private authService: AuthService
  ) {
    this.busForm = this.fb.group({
      clientId: ['', Validators.required],
      offreId: ['', Validators.required],
      compagnieBus: ['', Validators.required],
      typeBus: ['STANDARD', Validators.required],
      climatisation: [true, Validators.required],
    });

    this.trainForm = this.fb.group({
      clientId: ['', Validators.required],
      offreId: ['', Validators.required],
      compagnieTrain: ['', Validators.required],
      numeroWagon: ['', Validators.required],
      classeTrain: ['SECONDE', Validators.required],
    });

    this.avionForm = this.fb.group({
      clientId: ['', Validators.required],
      offreId: ['', Validators.required],
      compagnieAerienne: ['', Validators.required],
      numeroVol: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}\d{3,4}$/)]],
      classeAvion: ['ECONOMIE', Validators.required],
      poidsMaxBagages: [20, [Validators.required, Validators.min(10), Validators.max(100)]],
      numeroTerminal: [''],
    });
  }

  ngOnInit() {
    this.reservationService.getClients().subscribe({
      next: (res) => this.clients.set(res.data ?? res),
    });
    this.reservationService.getOffres().subscribe({
      next: (res) => this.offres.set(res),
    });

    this.rapportService.getGlobal().subscribe({
      next: (rapport) => {
        this.stats.set(this.mapRapportToStats(rapport));
        this.isLoadingStats.set(false);
      },
      error: () => {
        this.statsError.set('Statistiques indisponibles pour le moment.');
        this.isLoadingStats.set(false);
      },
    });

    // Pas d'endpoint unifié : bus/train/avion sont 3 contrôleurs séparés. On appelle
    // les 3 en parallèle et on fusionne. Un échec individuel (catchError → []) ne
    // bloque pas l'affichage des 2 autres types.
    forkJoin({
      bus: this.reservationService.getAllBus().pipe(catchError(() => of([]))),
      train: this.reservationService.getAllTrain().pipe(catchError(() => of([]))),
      avion: this.reservationService.getAllAvion().pipe(catchError(() => of([]))),
    }).subscribe(({ bus, train, avion }) => {
      const liste = [
        ...this.extraireListe(bus).map((r: any, i: number) => this.mapReservation(r, i, 'BUS')),
        ...this.extraireListe(train).map((r: any, i: number) => this.mapReservation(r, i, 'TRAIN')),
        ...this.extraireListe(avion).map((r: any, i: number) => this.mapReservation(r, i, 'AVION')),
      ];
      this.reservations.set(liste);
      this.isLoadingReservations.set(false);
    });
  }

  private extraireListe(res: any): any[] {
    const liste = res?.data ?? res;
    return Array.isArray(liste) ? liste : [];
  }

  // ⚠️ Mapping défensif : noms de champs devinés (non vérifiés contre le vrai DTO
  // RapportGlobal). Chaque valeur retombe sur 0 si le champ attendu n'existe pas,
  // plutôt que d'afficher un chiffre inventé.
  private mapRapportToStats(r: any): StatCard[] {
    const total = r?.total ?? r?.totalReservations ?? 0;
    const confirmees = r?.confirmees ?? r?.totalConfirmees ?? 0;
    const enAttente = r?.enAttente ?? r?.totalEnAttente ?? 0;
    const annulees = r?.annulees ?? r?.totalAnnulees ?? 0;
    const pctConfirmees = total > 0 ? Math.round((confirmees / total) * 100) : 0;

    return [
      { icon: 'bi-graph-up', iconBg: '#e6f1fb', iconColor: '#0c447c', label: 'TOTAL', value: String(total), valueColor: '#0f1e3d', subtitle: 'Volume global', subtitleColor: '#6b7280' },
      { icon: 'bi-check-circle', iconBg: '#e1f5ee', iconColor: '#0f6e56', label: 'CONFIRMÉES', value: String(confirmees), valueColor: '#0f6e56', subtitle: total > 0 ? `${pctConfirmees}% du volume total` : '—', subtitleColor: '#6b7280' },
      { icon: 'bi-emoji-neutral', iconBg: '#faeeda', iconColor: '#854f0b', label: 'EN ATTENTE', value: String(enAttente), valueColor: '#854f0b', subtitle: enAttente > 0 ? 'Nécessite action' : '—', subtitleColor: '#b45309' },
      { icon: 'bi-x-circle', iconBg: '#fcebeb', iconColor: '#a32d2d', label: 'ANNULÉES', value: String(annulees), valueColor: '#a32d2d', subtitle: annulees > 0 ? 'Pertes enregistrées' : '—', subtitleColor: '#a32d2d' },
    ];
  }

  // ⚠️ Mapping défensif : noms de champs devinés (non vérifiés contre le vrai DTO
  // Reservation). À ajuster dès que la forme réelle de /v1/reservations/get_all est connue.
  // Le type (BUS/TRAIN/AVION) est désormais connu avec certitude — il vient de
  // l'endpoint d'origine (getAllBus/getAllTrain/getAllAvion), plus besoin de le
  // deviner dans le corps de la réponse. Seuls les autres champs restent devinés.
  private mapReservation(r: any, index: number, type: 'BUS' | 'TRAIN' | 'AVION'): Reservation {
    const nom = r?.clientNom ?? r?.nom ?? r?.client?.nom ?? '';
    const prenom = r?.clientPrenom ?? r?.prenom ?? r?.client?.prenom ?? '';
    const nomComplet = `${nom} ${prenom}`.trim() || 'Client inconnu';
    const initiales = (nom?.[0] ?? '?').toUpperCase() + (prenom?.[0] ?? '').toUpperCase();

    return {
      initiales,
      avatarBg: AVATAR_COLORS[index % AVATAR_COLORS.length],
      nom: nomComplet,
      offre: r?.offreTitre ?? r?.offre?.titre ?? '—',
      typeIcon: type === 'AVION' ? 'bi-airplane' : type === 'TRAIN' ? 'bi-train-front' : 'bi-bus-front',
      typeLabel: type,
      date: r?.dateReservation ?? r?.date ?? '—',
      statut: (r?.statut ?? 'EN_ATTENTE') as Reservation['statut'],
    };
  }

  logout() {
    this.authService.logout();
  }

  badgeClass(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE': return 'badge-confirmee';
      case 'EN_ATTENTE': return 'badge-attente';
      case 'ANNULEE': return 'badge-annulee';
      default: return '';
    }
  }

  badgeLabel(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE': return 'CONFIRMÉE';
      case 'EN_ATTENTE': return 'EN ATTENTE';
      case 'ANNULEE': return 'ANNULÉE';
      default: return '';
    }
  }

  // NB : le tableau est en dur (pas de vrai GET /reservations pour l'instant), donc ces actions
  // ne mettent à jour que l'état local affiché — aucun PATCH backend n'est envoyé. À câbler plus
  // tard sur un vrai endpoint de changement de statut quand il existera côté API.
  confirmReservation(cible: Reservation) {
    this.reservations.update((liste) =>
      liste.map((r) => (r === cible ? { ...r, statut: 'CONFIRMEE' as const } : r))
    );
  }

  cancelReservation(cible: Reservation) {
    this.reservations.update((liste) =>
      liste.map((r) => (r === cible ? { ...r, statut: 'ANNULEE' as const } : r))
    );
  }

  voirBillet(r: Reservation) {
    alert(`Billet — ${r.nom} (${r.offre})\nFonctionnalité pas encore branchée au backend.`);
  }

  openModal() {
    this.showModal.set(true);
    this.formError.set(null);
    this.formSuccess.set(null);
  }

  closeModal() {
    this.showModal.set(false);
  }

  setTypeTransport(type: 'BUS' | 'TRAIN' | 'AVION') {
    this.typeTransport.set(type);
    this.formError.set(null);
  }

  get activeForm(): FormGroup {
    switch (this.typeTransport()) {
      case 'BUS': return this.busForm;
      case 'TRAIN': return this.trainForm;
      case 'AVION': return this.avionForm;
    }
  }

  submit() {
    const form = this.activeForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    const raw = form.value;
    const payload = {
      ...raw,
      clientId: Number(raw.clientId),
      offreId: Number(raw.offreId),
    };

    const request$ = this.typeTransport() === 'BUS'
      ? this.reservationService.createBus(payload)
      : this.typeTransport() === 'TRAIN'
        ? this.reservationService.createTrain(payload)
        : this.reservationService.createAvion(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.formSuccess.set('Réservation créée avec succès.');
        setTimeout(() => this.closeModal(), 1200);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formError.set(err.error?.message || 'Erreur lors de la création de la réservation.');
      },
    });
  }
}
