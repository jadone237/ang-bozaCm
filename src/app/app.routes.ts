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

  // --- Zone Administration (Sous ton AdminLayout avec Sidebar) ---
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'agences', loadComponent: () => import('./features/agences/pages/agence-list/agence-list.component').then(m => m.AgenceListComponent) },
      { path: 'ajouter-agence', loadComponent: () => import('./features/agences/components/agence-form/agence-form.component').then(m => m.AgenceFormComponent) },
      { path: 'modifier-agence/:id', loadComponent: () => import('./features/agences/components/agence-form/agence-form.component').then(m => m.AgenceFormComponent) },

      { path: 'trajets', loadComponent: () => import('./features/trajets/pages/trajet-list/trajet-list.component').then(m => m.TrajetListComponent) },
      { path: 'ajouter-trajet', loadComponent: () => import('./features/trajets/components/trajet-form/trajet-form.component').then(m => m.TrajetFormComponent) },
      { path: 'modifier-trajet/:id', loadComponent: () => import('./features/trajets/components/trajet-form/trajet-form.component').then(m => m.TrajetFormComponent) },

      { path: 'offres', loadComponent: () => import('./features/offres/pages/offre-list/offre-list.component').then(m => m.OffreListComponent) },
      { path: 'ajouter-offre', loadComponent: () => import('./features/offres/components/offre-form/offre-form.component').then(m => m.OffreFormComponent) },
      { path: 'modifier-offre/:id', loadComponent: () => import('./features/offres/components/offre-form/offre-form.component').then(m => m.OffreFormComponent) },

      { path: 'statistiques', loadComponent: () => import('./features/statistiques/pages/stat-list/stat-list.component').then(m => m.StatListComponent) },
      { path: 'agences/:id/statistiques', loadComponent: () => import('./features/statistiques/component/ag-stats/ag-stats.component').then(m => m.AgStatsComponent) },

      { path: 'rapports', loadComponent: () => import('./features/rapport/pages/rapport-global/rapport-global.component').then(m => m.RapportGlobalComponent) },

      // Module Réservations (issu du travail de ton camarade)
      { path: 'reservations', loadComponent: () => import('./features/admin/pages/bookings/bookings.component').then(m => m.BookingsComponent) }
    ]
  },

  // Redirection par défaut si route inconnue
  { path: '**', redirectTo: 'login' }
];