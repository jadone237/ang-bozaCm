import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AgenceListComponent } from './features/agences/pages/agence-list/agence-list.component';
import { AgenceFormComponent } from './components/agence-form/agence-form.component';
import { TrajetListComponent } from './features/trajets/pages/trajet-list/trajet-list.component';
import { TrajetFormComponent } from './components/trajet-form/trajet-form.component';
import { OffreListComponent } from './features/offres/pages/offre-list/offre-list.component';
import { OffreFormComponent } from './components/offre-form/offre-form.component';

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
      { path: '', redirectTo: 'agences', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];