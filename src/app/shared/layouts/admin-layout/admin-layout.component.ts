import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,       // Indispensable pour afficher dynamiquement les pages enfants (Agences, Trajets, etc.)
    RouterLink,         // Permet d'utiliser routerLink dans le HTML pour naviguer sans recharger la page
    RouterLinkActive    // Permet d'appliquer automatiquement une classe CSS (ex: 'active') sur le lien cliqué
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  themeService = inject(ThemeService);
  isSidebarOpen = false;

  deconnexion(event: Event): void {
    event.preventDefault();
    this.fermerSidebar();
    this.authService.logout();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  fermerSidebar(): void {
    this.isSidebarOpen = false;
  }
}