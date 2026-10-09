import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ClientReservationService } from '../../core/services/client-reservation.service';

@Component({
  selector: 'app-client-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './client-navbar.component.html',
  styleUrl: './client-navbar.component.css',
})
export class ClientNavbarComponent implements OnInit {
  isNotifMenuOpen = signal(false);
  isProfileMenuOpen = signal(false);

  nomAffiche = computed(() => {
    const c = this.reservationService.client();
    return c ? `${c.prenom} ${c.nom}`.trim() : (this.authService.currentEmail() ?? 'Mon compte');
  });
  initiale = computed(() => (this.nomAffiche()[0] ?? 'C').toUpperCase());
  email = computed(() => this.authService.currentEmail() ?? '');
  /** Visiteur sans compte : pas de notifications ni de menu profil, mais Connexion / Inscription. */
  readonly estConnecte: boolean;

  constructor(
    public themeService: ThemeService,
    public reservationService: ClientReservationService,
    private authService: AuthService
  ) {
    this.estConnecte = this.authService.isAuthenticated();
  }

  ngOnInit() {
    if (this.estConnecte && !this.reservationService.client()) {
      this.reservationService.load();
    }
  }

  toggleNotifMenu(event: Event) {
    event.stopPropagation();
    this.isProfileMenuOpen.set(false);
    if (this.isNotifMenuOpen()) {
      this.closeMenus();
    } else {
      this.isNotifMenuOpen.set(true);
    }
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.isNotifMenuOpen.set(false);
    this.isProfileMenuOpen.update((v) => !v);
  }

  @HostListener('document:click')
  closeMenus() {
    if (this.isNotifMenuOpen()) this.reservationService.markNotificationsSeen();
    this.isNotifMenuOpen.set(false);
    this.isProfileMenuOpen.set(false);
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'en attente de confirmation';
      case 'CONFIRMEE': return 'confirmée';
      case 'ANNULEE': return 'annulée';
      case 'COMPLETEE': return 'terminée';
      default: return '';
    }
  }

  logout() {
    this.authService.logout();
  }
}
