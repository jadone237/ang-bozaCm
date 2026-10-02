import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservationAdminService } from '../../services/reservation-admin.service';
import { OffreService } from '../../../offres/data-access/offre.service';
import { OffreResponseDTO } from '../../../offres/models/offre.model';

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
  offres = signal<OffreResponseDTO[]>([]);

  busForm: FormGroup;
  trainForm: FormGroup;
  avionForm: FormGroup;

  stats: StatCard[] = [
    { icon: 'bi-graph-up', iconBg: '#e6f1fb', iconColor: '#0c447c', label: 'TOTAL', value: '34', valueColor: '#0f1e3d', subtitle: 'Volume global mensuel', subtitleColor: '#6b7280' },
    { icon: 'bi-check-circle', iconBg: '#e1f5ee', iconColor: '#0f6e56', label: 'CONFIRMÉES', value: '20', valueColor: '#0f6e56', subtitle: '62% du volume total', subtitleColor: '#6b7280' },
    { icon: 'bi-emoji-neutral', iconBg: '#faeeda', iconColor: '#854f0b', label: 'EN ATTENTE', value: '10', valueColor: '#854f0b', subtitle: 'Nécessite action', subtitleColor: '#b45309' },
    { icon: 'bi-x-circle', iconBg: '#fcebeb', iconColor: '#a32d2d', label: 'ANNULÉES', value: '4', valueColor: '#a32d2d', subtitle: 'Pertes enregistrées', subtitleColor: '#a32d2d' },
  ];

  reservations = signal<Reservation[]>([
    { initiales: 'SA', avatarBg: '#c7d2fe', nom: 'Serge Atangana', offre: 'VIP Ydé -> Dla', typeIcon: 'bi-bus-front', typeLabel: 'BUS', date: '25/03/2026', statut: 'CONFIRMEE' },
    { initiales: 'FM', avatarBg: '#a7f3d0', nom: 'Florence Mvondo', offre: 'Vol Dla -> Garoua', typeIcon: 'bi-airplane', typeLabel: 'AVION', date: '26/03/2026', statut: 'EN_ATTENTE' },
    { initiales: 'EB', avatarBg: '#e5e7eb', nom: 'Estelle Beyala', offre: 'Express Baf -> Bda', typeIcon: 'bi-bus-front', typeLabel: 'BUS', date: '28/03/2026', statut: 'ANNULEE' },
  ]);

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
    this.reservationService.getClients().subscribe({
      next: (res) => this.clients.set(res.data ?? res),
    });
    this.offreService.getAllOffres().subscribe({
      next: (offres) => this.offres.set(offres),
      error: (err) => this.formError.set(err.message || 'Impossible de charger les offres.'),
    });
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

    let request$;
    switch (this.typeTransport()) {
      case 'BUS': request$ = this.reservationService.createBus(payload); break;
      case 'TRAIN': request$ = this.reservationService.createTrain(payload); break;
      case 'AVION': request$ = this.reservationService.createAvion(payload); break;
    }

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
