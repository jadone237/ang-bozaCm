import { Component, OnInit, computed, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservationAdminService } from '../../services/reservation-admin.service';
import { OffreService } from '../../../offres/data-access/offre.service';
import { OffreResponseDTO } from '../../../offres/models/offre.model';
import { RapportService, RapportGlobal } from '../../../../core/services/rapport.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AdminService, AdminProfile } from '../../services/admin.service';
import { NotificationService } from '../../../../shared/ui/notification.service';

interface StatCard {
  icon: string; iconBg: string; iconColor: string;
  label: string; value: string; valueColor: string;
  subtitle: string; subtitleColor: string;
}

type TypeTransport = 'BUS' | 'TRAIN' | 'AVION';
type Statut = 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE';

interface Reservation {
  id: number; type: TypeTransport; clientId: number | null;
  initiales: string; avatarBg: string; nom: string; email: string;
  offre: string; compagnie: string;
  typeIcon: string; typeLabel: string;
  date: string | null; createdAt: string | null;
  statut: Statut; billetNumero: string | null;
}

const AVATAR_COLORS = ['#c7d2fe', '#a7f3d0', '#fbcfe8', '#fde68a', '#bfdbfe'];
const PAGE_SIZE = 10;

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.css',
})
export class BookingsComponent implements OnInit {
  private notifications = inject(NotificationService);
  statutFilter = signal('Tous statuts');
  typeFilter = signal('Tous types');
  recherche = signal('');
  page = signal(1);

  showModal = signal(false);
  isSubmitting = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);
  typeTransport = signal<TypeTransport>('BUS');
  private feedbackTimer?: ReturnType<typeof setTimeout>;

  clients = signal<any[]>([]);
  offres = signal<OffreResponseDTO[]>([]);

  busForm: FormGroup;
  trainForm: FormGroup;
  avionForm: FormGroup;

  stats = signal<StatCard[]>([]);
  isLoadingStats = signal(true);
  statsError = signal('');

  reservations = signal<Reservation[]>([]);
  isLoadingReservations = signal(true);
  reservationsError = signal('');

  // Clé (type-id) de la ligne dont une action (confirmer/annuler/billet) est en cours.
  actionEnCours = signal<string | null>(null);
  actionError = signal('');

  isNotifMenuOpen = signal(false);
  isProfileMenuOpen = signal(false);

  pendingReservations = computed(() =>
    this.reservations().filter((r) => r.statut === 'EN_ATTENTE').slice(0, 5)
  );
  pendingCount = computed(() => this.reservations().filter((r) => r.statut === 'EN_ATTENTE').length);

  adminProfile = signal<AdminProfile | null>(null);
  adminEmail = computed(() => this.adminProfile()?.email ?? this.authService.currentUser()?.email ?? 'Admin');
  adminNom = computed(() => this.adminProfile()?.nom ?? this.adminEmail());
  adminInitiale = computed(() => (this.adminNom()[0] ?? 'A').toUpperCase());

  filteredReservations = computed(() => {
    const statut = this.statutFilter();
    const type = this.typeFilter();
    const terme = this.recherche().trim().toLowerCase();

    return this.reservations().filter((r) => {
      const matchStatut = statut === 'Tous statuts' || this.badgeLabel(r.statut).toLowerCase() === statut.toLowerCase();
      const matchType = type === 'Tous types' || r.typeLabel.toLowerCase() === type.toLowerCase();
      const matchRecherche = !terme || [r.nom, r.email, r.offre, r.compagnie, r.typeLabel, r.billetNumero ?? '']
        .some((champ) => champ.toLowerCase().includes(terme));
      return matchStatut && matchType && matchRecherche;
    });
  });

  // La pagination n'apparaît que si les résultats dépassent une page (PAGE_SIZE lignes).
  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredReservations().length / PAGE_SIZE)));
  pageCourante = computed(() => Math.min(this.page(), this.totalPages()));
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  pagedReservations = computed(() => {
    const debut = (this.pageCourante() - 1) * PAGE_SIZE;
    return this.filteredReservations().slice(debut, debut + PAGE_SIZE);
  });
  premierAffiche = computed(() =>
    this.filteredReservations().length === 0 ? 0 : (this.pageCourante() - 1) * PAGE_SIZE + 1
  );
  dernierAffiche = computed(() =>
    Math.min(this.pageCourante() * PAGE_SIZE, this.filteredReservations().length)
  );

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationAdminService,
    private rapportService: RapportService,
    private authService: AuthService,
    private adminService: AdminService,
    private offreService: OffreService
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
    this.adminService.getMe().subscribe({
      next: (res) => this.adminProfile.set(res.data),
      error: () => {}, // le header retombe sur l'email de la session en cas d'échec
    });

    this.reservationService.getClients().subscribe({
      next: (res) => this.clients.set(res.data ?? res),
    });
    this.offreService.getAllOffres().subscribe({
      next: (offres) => this.offres.set(offres),
      error: (err) => this.formError.set(err.message || 'Impossible de charger les offres.'),
    });

    this.chargerStats();
    this.chargerReservations();
  }

  private chargerStats() {
    this.rapportService.getGlobal().subscribe({
      next: (rapport) => {
        this.stats.set(this.mapRapportToStats(rapport));
        this.statsError.set('');
        this.isLoadingStats.set(false);
      },
      error: () => {
        this.statsError.set('Statistiques indisponibles pour le moment.');
        this.isLoadingStats.set(false);
      },
    });
  }

  // Pas d'endpoint unifié : bus/train/avion sont 3 contrôleurs séparés. On appelle
  // les 3 en parallèle et on fusionne. Un échec individuel ne bloque pas les 2 autres ;
  // on n'affiche une erreur que si les 3 appels échouent.
  private chargerReservations() {
    forkJoin({
      bus: this.reservationService.getAllBus().pipe(catchError(() => of(null))),
      train: this.reservationService.getAllTrain().pipe(catchError(() => of(null))),
      avion: this.reservationService.getAllAvion().pipe(catchError(() => of(null))),
    }).subscribe(({ bus, train, avion }) => {
      if (!bus && !train && !avion) {
        this.reservationsError.set('Réservations indisponibles pour le moment.');
        this.isLoadingReservations.set(false);
        return;
      }

      const liste = [
        ...this.extraireListe(bus).map((r: any) => this.mapReservation(r, 'BUS')),
        ...this.extraireListe(train).map((r: any) => this.mapReservation(r, 'TRAIN')),
        ...this.extraireListe(avion).map((r: any) => this.mapReservation(r, 'AVION')),
      ].sort((a, b) => this.time(b.createdAt) - this.time(a.createdAt));

      liste.forEach((r, i) => (r.avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length]));
      this.reservations.set(liste);
      this.reservationsError.set('');
      this.isLoadingReservations.set(false);
    });
  }

  private extraireListe(res: any): any[] {
    const liste = res?.data ?? res;
    return Array.isArray(liste) ? liste : [];
  }

  // Champs de RapportGlobalDTO (backend) : totalReservations, totalConfirmees,
  // totalEnAttente, totalAnnulees, tauxConfirmation.
  private mapRapportToStats(r: RapportGlobal): StatCard[] {
    const total = r.totalReservations ?? 0;
    const confirmees = r.totalConfirmees ?? 0;
    const enAttente = r.totalEnAttente ?? 0;
    const annulees = r.totalAnnulees ?? 0;
    const taux = Math.round(r.tauxConfirmation ?? 0);

    return [
      { icon: 'bi-graph-up', iconBg: '#e6f1fb', iconColor: '#0c447c', label: 'TOTAL', value: String(total), valueColor: '#0f1e3d', subtitle: 'Volume global', subtitleColor: '#6b7280' },
      { icon: 'bi-check-circle', iconBg: '#e1f5ee', iconColor: '#0f6e56', label: 'CONFIRMÉES', value: String(confirmees), valueColor: '#0f6e56', subtitle: total > 0 ? `${taux}% du volume total` : '—', subtitleColor: '#6b7280' },
      { icon: 'bi-emoji-neutral', iconBg: '#faeeda', iconColor: '#854f0b', label: 'EN ATTENTE', value: String(enAttente), valueColor: '#854f0b', subtitle: enAttente > 0 ? 'Nécessite action' : '—', subtitleColor: '#b45309' },
      { icon: 'bi-x-circle', iconBg: '#fcebeb', iconColor: '#a32d2d', label: 'ANNULÉES', value: String(annulees), valueColor: '#a32d2d', subtitle: annulees > 0 ? 'Pertes enregistrées' : '—', subtitleColor: '#a32d2d' },
    ];
  }

  // Champs des Reservation{Bus,Train,Avion}ResponseDTO (backend).
  private mapReservation(r: any, type: TypeTransport): Reservation {
    const nom = (r.clientNomComplet ?? '').trim() || 'Client inconnu';
    const mots = nom.split(/\s+/);
    const initiales = ((mots[0]?.[0] ?? '?') + (mots[1]?.[0] ?? '')).toUpperCase();
    const trajet = r.villeDeDepart && r.villeArrivee ? `${r.villeDeDepart} → ${r.villeArrivee}` : '—';

    return {
      id: r.idReservation,
      type,
      clientId: r.clientId ?? null,
      initiales,
      avatarBg: AVATAR_COLORS[0],
      nom,
      email: r.clientEmail ?? '',
      offre: trajet,
      compagnie: r.compagnieBus ?? r.compagnieTrain ?? r.compagnieAerienne ?? '',
      typeIcon: type === 'AVION' ? 'bi-airplane' : type === 'TRAIN' ? 'bi-train-front' : 'bi-bus-front',
      typeLabel: type,
      date: r.dateDepart ?? null,
      createdAt: r.createdAt ?? null,
      statut: r.statutReservation,
      billetNumero: r.billetNumero ?? null,
    };
  }

  private time(value: string | null) {
    return value ? new Date(value).getTime() : 0;
  }

  cle(r: Reservation) {
    return `${r.type}-${r.id}`;
  }

  logout() {
    this.authService.logout();
  }

  toggleNotifMenu(event: Event) {
    event.stopPropagation();
    this.isProfileMenuOpen.set(false);
    this.isNotifMenuOpen.update((v) => !v);
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.isNotifMenuOpen.set(false);
    this.isProfileMenuOpen.update((v) => !v);
  }

  // Ferme les menus déroulants au clic en dehors (sur n'importe quel autre élément de la page).
  @HostListener('document:click')
  closeMenus() {
    this.isNotifMenuOpen.set(false);
    this.isProfileMenuOpen.set(false);
  }

  voirReservationsEnAttente() {
    this.setStatutFilter('En attente');
    this.isNotifMenuOpen.set(false);
  }

  setStatutFilter(valeur: string) {
    this.statutFilter.set(valeur);
    this.page.set(1);
  }

  setTypeFilter(valeur: string) {
    this.typeFilter.set(valeur);
    this.page.set(1);
  }

  setRecherche(valeur: string) {
    this.recherche.set(valeur);
    this.page.set(1);
  }

  allerPage(n: number) {
    if (n >= 1 && n <= this.totalPages()) this.page.set(n);
  }

  badgeClass(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE': return 'badge-confirmee';
      case 'EN_ATTENTE': return 'badge-attente';
      case 'ANNULEE': return 'badge-annulee';
      case 'TERMINEE': return 'badge-terminee';
      default: return '';
    }
  }

  badgeLabel(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE': return 'CONFIRMÉE';
      case 'EN_ATTENTE': return 'EN ATTENTE';
      case 'ANNULEE': return 'ANNULÉE';
      case 'TERMINEE': return 'TERMINÉE';
      default: return statut ?? '';
    }
  }

  confirmReservation(cible: Reservation) {
    this.changerStatut(cible, this.reservationService.confirmer(cible.type, cible.id), 'la confirmation');
  }

  async cancelReservation(cible: Reservation) {
    const confirme = await this.notifications.confirmer({
      titre: 'Annuler la réservation',
      message: `Annuler la réservation de ${cible.nom} (${cible.offre}) ? La place sera rendue à l’offre.`,
      libelleConfirmer: 'Annuler la réservation'
    });
    if (!confirme) return;
    this.changerStatut(cible, this.reservationService.annuler(cible.type, cible.id), "l'annulation");
  }

  private changerStatut(cible: Reservation, requete$: ReturnType<ReservationAdminService['confirmer']>, action: string) {
    this.actionEnCours.set(this.cle(cible));
    this.actionError.set('');

    requete$.subscribe({
      next: (res) => {
        const statut = (res?.data?.statutReservation ?? cible.statut) as Statut;
        this.mettreAJour(cible, { statut });
        this.actionEnCours.set(null);
        this.chargerStats();
      },
      error: (err) => {
        this.actionEnCours.set(null);
        this.actionError.set(err.error?.message || `Échec de ${action} de la réservation de ${cible.nom}.`);
      },
    });
  }

  // Télécharge le PDF du billet ; le génère d'abord côté serveur s'il n'existe pas encore.
  voirBillet(r: Reservation) {
    this.actionError.set('');

    if (r.billetNumero) {
      this.telechargerBillet(r, r.billetNumero);
      return;
    }

    if (r.clientId == null) {
      this.actionError.set(`Impossible de générer le billet : client inconnu pour la réservation #${r.id}.`);
      return;
    }

    this.actionEnCours.set(this.cle(r));
    this.reservationService.creerBillet(r.id, r.clientId).subscribe({
      next: (res) => {
        const numero: string | undefined = res?.data?.numeroBillet;
        if (!numero) {
          this.actionEnCours.set(null);
          this.actionError.set('Billet créé, mais son numéro est introuvable dans la réponse du serveur.');
          return;
        }
        this.mettreAJour(r, { billetNumero: numero });
        this.telechargerBillet(r, numero);
      },
      error: (err) => {
        this.actionEnCours.set(null);
        this.actionError.set(err.error?.message || `Échec de la génération du billet de ${r.nom}.`);
      },
    });
  }

  private telechargerBillet(r: Reservation, numero: string) {
    this.actionEnCours.set(this.cle(r));
    this.reservationService.telechargerBillet(numero).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = `Billet_${numero}.pdf`;
        lien.click();
        URL.revokeObjectURL(url);
        this.actionEnCours.set(null);
      },
      error: () => {
        this.actionEnCours.set(null);
        this.actionError.set(`Impossible de télécharger le billet ${numero}.`);
      },
    });
  }

  private mettreAJour(cible: Reservation, changements: Partial<Reservation>) {
    const cleCible = this.cle(cible);
    this.reservations.update((liste) =>
      liste.map((r) => (this.cle(r) === cleCible ? { ...r, ...changements } : r))
    );
  }

  openModal() {
    this.clearFeedbackTimer();
    this.showModal.set(true);
    this.formError.set(null);
    this.formSuccess.set(null);
  }

  closeModal() {
    this.clearFeedbackTimer();
    this.formSuccess.set(null);
    this.formError.set(null);
    this.showModal.set(false);
  }

  private clearFeedbackTimer(): void {
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = undefined;
    }
  }

  setTypeTransport(type: TypeTransport) {
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
        this.chargerReservations();
        this.chargerStats();
        this.clearFeedbackTimer();
        this.feedbackTimer = setTimeout(() => this.closeModal(), 1500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formError.set(err.error?.message || 'Erreur lors de la création de la réservation.');
        this.clearFeedbackTimer();
        this.feedbackTimer = setTimeout(() => this.formError.set(null), 5000);
      },
    });
  }
}
