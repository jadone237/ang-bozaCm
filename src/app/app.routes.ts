import { Routes } from '@angular/router';
import { AgenceListComponent } from './features/agences/pages/agence-list/agence-list.component';
import { TrajetListComponent } from './features/trajets/pages/trajet-list/trajet-list.component';
import { OffreListComponent } from './features/offres/pages/offre-list/offre-list.component';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout.component';
import { OffreFormComponent } from './features/offres/components/offre-form/offre-form.component';
import { TrajetFormComponent } from './features/trajets/components/trajet-form/trajet-form.component';
import { AgenceFormComponent } from './features/agences/components/agence-form/agence-form.component';
import { AgStatsComponent } from './features/statistiques/component/ag-stats/ag-stats.component';
import { StatListComponent } from './features/statistiques/pages/stat-list/stat-list.component';
import { RapportGlobalComponent } from './features/rapport/pages/rapport-global/rapport-global.component';
export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent, // Le layout enveloppe toutes les routes ci-dessous
    children: [
      { path: 'agences', component: AgenceListComponent },
      { path: 'trajets', component: TrajetListComponent },
      { path: 'offres', component: OffreListComponent },
      { path: 'ajouter-offre', component: OffreFormComponent },
      { path: 'modifier-offre/:id', component: OffreFormComponent },
      { path: 'ajouter-trajet', component: TrajetFormComponent },
      { path: 'modifier-trajet/:id', component: TrajetFormComponent },
      { path: 'ajouter-agence', component: AgenceFormComponent },
      { path: 'modifier-agence/:id', component: AgenceFormComponent },
      { path: '', redirectTo: 'agences', pathMatch: 'full' },
      {path: 'statistiques',component: StatListComponent},
      {path: 'rapports',component: RapportGlobalComponent},
      {path: 'statistiques/:id/statistiques',component: AgStatsComponent}
    ]
  },
  { path: '**', redirectTo: '' }
];