import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservationAdminService } from '../../services/reservation-admin.service';

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
  offres = signal<any[]>([]);

  busForm: FormGroup;
  trainForm: FormGroup;
  avionForm: FormGroup;

  stats: StatCard[] = [
    { icon: 'bi-graph-up', iconBg: '#e6f1fb', iconColor: '#0c447c', label: 'TOTAL', value: '34', valueColor: '#0f1e3d', subtitle: 'Volume global mensuel', subtitleColor: '#6b7280' },
    { icon: 'bi-check-circle', iconBg: '#e1f5ee', iconColor: '#0f6e56', label: 'CONFIRMÉES', value: '20', valueColor: '#0f6e56', subtitle: '62% du volume total', subtitleColor: '#6b7280' },
    { icon: 'bi-emoji-neutral', iconBg: '#faeeda', iconColor: '#854f0b', label: 'EN ATTENTE', value: '10', valueColor: '#854f0b', subtitle: 'Nécessite action', subtitleColor: '#b45309' },
    { icon: 'bi-x-circle', iconBg: '#fcebeb', iconColor: '#a32d2d', label: 'ANNULÉES', value: '4', valueColor: '#a32d2d', subtitle: 'Pertes enregistrées', subtitleColor: '#a32d2d' },
  ];

  reservations: Reservation[] = [
    { initiales: 'SA', avatarBg: '#c7d2fe', nom: 'Serge Atangana', offre: 'VIP Ydé -> Dla', typeIcon: 'bi-bus-front', typeLabel: 'BUS', date: '25/03/2026', statut: 'CONFIRMEE' },
    { initiales: 'FM', avatarBg: '#a7f3d0', nom: 'Florence Mvondo', offre: 'Vol Dla -> Garoua', typeIcon: 'bi-airplane', typeLabel: 'AVION', date: '26/03/2026', statut: 'EN_ATTENTE' },
    { initiales: 'EB', avatarBg: '#e5e7eb', nom: 'Estelle Beyala', offre: 'Express Baf -> Bda', typeIcon: 'bi-bus-front', typeLabel: 'BUS', date: '28/03/2026', statut: 'ANNULEE' },
  ];

  constructor(private fb: FormBuilder, private reservationService: ReservationAdminService) {
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
