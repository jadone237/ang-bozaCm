import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout.component';

export const routes: Routes = [
  // --- Zone Publique / Client & Auth ---
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent) 
  },
  { 
    path: 'accueil', 
    loadComponent: () => import('./features/client/pages/accueil/accueil.component').then(m => m.AccueilComponent) 
  },

  // Compatibilité avec les liens absolus présents dans les listes et formulaires.
  { path: 'agences', redirectTo: '/admin/agences', pathMatch: 'full' },
  { path: 'ajouter-agence', redirectTo: '/admin/ajouter-agence', pathMatch: 'full' },
  { path: 'modifier-agence/:id', redirectTo: '/admin/modifier-agence/:id', pathMatch: 'full' },
  { path: 'trajets', redirectTo: '/admin/trajets', pathMatch: 'full' },
  { path: 'ajouter-trajet', redirectTo: '/admin/ajouter-trajet', pathMatch: 'full' },
  { path: 'modifier-trajet/:id', redirectTo: '/admin/modifier-trajet/:id', pathMatch: 'full' },
  { path: 'offres', redirectTo: '/admin/offres', pathMatch: 'full' },
  { path: 'ajouter-offre', redirectTo: '/admin/ajouter-offre', pathMatch: 'full' },
  { path: 'modifier-offre/:id', redirectTo: '/admin/modifier-offre/:id', pathMatch: 'full' },
  { path: 'statistiques', redirectTo: '/admin/statistiques', pathMatch: 'full' },
  { path: 'statistiques/:id/statistiques', redirectTo: '/admin/statistiques/:id/statistiques', pathMatch: 'full' },
  { path: 'rapports', redirectTo: '/admin/rapports', pathMatch: 'full' },
  { path: 'reservations', redirectTo: '/admin/reservations', pathMatch: 'full' },

  // --- Espace Dashboard Admin (AdminLayoutComponent) ---
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      // Redirections automatiques vers la page d'accueil du dashboard (agences)
      { path: '', redirectTo: 'agences', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'agences', pathMatch: 'full' },

      // 1. Agences
      { path: 'agences', loadComponent: () => import('./features/agences/pages/agence-list/agence-list.component').then(m => m.AgenceListComponent) },
      { path: 'ajouter-agence', loadComponent: () => import('./features/agences/components/agence-form/agence-form.component').then(m => m.AgenceFormComponent) },
      { path: 'modifier-agence/:id', loadComponent: () => import('./features/agences/components/agence-form/agence-form.component').then(m => m.AgenceFormComponent) },

      // 2. Trajets
      { path: 'trajets', loadComponent: () => import('./features/trajets/pages/trajet-list/trajet-list.component').then(m => m.TrajetListComponent) },
      { path: 'ajouter-trajet', loadComponent: () => import('./features/trajets/components/trajet-form/trajet-form.component').then(m => m.TrajetFormComponent) },
      { path: 'modifier-trajet/:id', loadComponent: () => import('./features/trajets/components/trajet-form/trajet-form.component').then(m => m.TrajetFormComponent) },

      // 3. Offres
      { path: 'offres', loadComponent: () => import('./features/offres/pages/offre-list/offre-list.component').then(m => m.OffreListComponent) },
      { path: 'ajouter-offre', loadComponent: () => import('./features/offres/components/offre-form/offre-form.component').then(m => m.OffreFormComponent) },
      { path: 'modifier-offre/:id', loadComponent: () => import('./features/offres/components/offre-form/offre-form.component').then(m => m.OffreFormComponent) },

      // 4. Statistiques
      { path: 'statistiques', loadComponent: () => import('./features/statistiques/pages/stat-list/stat-list.component').then(m => m.StatListComponent) },
      { path: 'statistiques/:id/statistiques', loadComponent: () => import('./features/statistiques/component/ag-stats/ag-stats.component').then(m => m.AgStatsComponent) },

      // 5. Rapports
      { path: 'rapports', loadComponent: () => import('./features/rapport/pages/rapport-global/rapport-global.component').then(m => m.RapportGlobalComponent) },

      // 6. Réservations
      { path: 'reservations', loadComponent: () => import('./features/admin/pages/bookings/bookings.component').then(m => m.BookingsComponent) }
    ]
  },

  // Route fallback
  { path: '**', redirectTo: 'login' }
];