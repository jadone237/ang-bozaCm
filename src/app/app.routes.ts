import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { AccueilComponent } from './features/client/pages/accueil/accueil.component';
import { BookingsComponent } from './features/admin/pages/bookings/bookings.component';




export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'accueil', component: AccueilComponent },
  { path: 'admin/bookings', component: BookingsComponent },
];