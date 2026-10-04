import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { AccueilComponent } from './features/client/pages/accueil/accueil.component';
import { BookingsComponent } from './features/admin/pages/bookings/bookings.component';
import { ProfileComponent } from './features/admin/pages/profile/profile.component';
import { MesReservationsComponent } from './features/client/pages/mes-reservations/mes-reservations.component';
import { ProfilComponent } from './features/client/pages/profil/profil.component';
import { ReservationComponent } from './features/client/pages/reservation/reservation.component';




export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'accueil', component: AccueilComponent },
  { path: 'admin/bookings', component: BookingsComponent },
  { path: 'admin/profil', component: ProfileComponent },
  { path: 'reservation/:type/:offreId', component: ReservationComponent },
  { path: 'client/mes-reservations', component: MesReservationsComponent },
  { path: 'client/profil', component: ProfilComponent },
];