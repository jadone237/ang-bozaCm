import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientNavbarComponent } from '../../../../shared/client-navbar/client-navbar.component';
import { ClientReservation, ClientReservationService } from '../../../../core/services/client-reservation.service';
import { AuthService } from '../../../../core/auth/auth.service';

type Onglet = 'en-cours' | 'passees' | 'annulees';

@Component({
  selector: 'app-mes-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink, ClientNavbarComponent],
  templateUrl: './mes-reservations.component.html',
  styleUrl: './mes-reservations.component.css',
})
export class MesReservationsComponent implements OnInit {
  onglet = signal<Onglet>('en-cours');
  actionError = signal('');
  busyId = signal<string | null>(null);

  // En cours = en attente / confirmée dont le départ n'est pas passé. Passées = terminées ou départ dépassé.
  enCours = computed(() => this.reservationService.reservations().filter((r) => this.estEnCours(r)));
  passees = computed(() => this.reservationService.reservations().filter((r) => this.estPassee(r)));
  annulees = computed(() => this.reservationService.reservations().filter((r) => r.statut === 'ANNULEE'));

  affichees = computed(() => {
    switch (this.onglet()) {
      case 'en-cours': return this.enCours();
      case 'passees': return this.passees();
      case 'annulees': return this.annulees();
    }
  });

  enAttente = computed(() => this.reservationService.reservations().filter((r) => r.statut === 'EN_ATTENTE').length);
  estConnecte = computed(() => !!this.authService.currentEmail());

  constructor(public reservationService: ClientReservationService, private authService: AuthService) {}

  ngOnInit() {
    this.reservationService.load();
  }

  setOnglet(o: Onglet) {
    this.onglet.set(o);
  }

  cle(r: ClientReservation) {
    return `${r.type}-${r.id}`;
  }

  icone(r: ClientReservation) {
    return r.type === 'AVION' ? 'bi-airplane' : r.type === 'TRAIN' ? 'bi-train-front' : 'bi-bus-front';
  }

  statutLabel(s: string) {
    switch (s) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE': return 'Confirmée';
      case 'ANNULEE': return 'Annulée';
      case 'COMPLETEE': return 'Terminée';
      default: return s;
    }
  }

  peutAnnuler(r: ClientReservation) {
    return r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRMEE';
  }

  annuler(r: ClientReservation) {
    if (!confirm(`Annuler la réservation ${r.depart} → ${r.arrivee} ?`)) return;

    this.actionError.set('');
    this.busyId.set(this.cle(r));
    this.reservationService.annuler(r).subscribe({
      next: () => {
        this.busyId.set(null);
        this.reservationService.load();
      },
      error: (err) => {
        this.busyId.set(null);
        this.actionError.set(err.error?.message || "Impossible d'annuler cette réservation.");
      },
    });
  }

  telechargerBillet(r: ClientReservation) {
    if (!r.billetNumero) return;

    this.actionError.set('');
    this.reservationService.telechargerBillet(r.billetNumero).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => this.actionError.set('Billet indisponible pour le moment.'),
    });
  }

  private estEnCours(r: ClientReservation) {
    return (r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRMEE') && !this.departDepasse(r);
  }

  private estPassee(r: ClientReservation) {
    return r.statut === 'COMPLETEE' || ((r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRMEE') && this.departDepasse(r));
  }

  private departDepasse(r: ClientReservation) {
    return !!r.dateDepart && new Date(r.dateDepart).getTime() < Date.now();
  }
}
