import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

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
  // Aucune logique complexe nécessaire ici pour l'instant, le layout sert de structure fixe.
}