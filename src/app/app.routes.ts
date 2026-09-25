import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AgenceListComponent } from './features/agences/pages/agence-list/agence-list.component';
import { AgenceFormComponent } from './components/agence-form/agence-form.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent, // Le layout enveloppe toutes les routes ci-dessous
    children: [
      { path: 'agences', component: AgenceListComponent },
      { path: 'ajouter-agence', component: AgenceFormComponent },
      { path: 'modifier-agence/:id', component: AgenceFormComponent },
      { path: '', redirectTo: 'agences', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];