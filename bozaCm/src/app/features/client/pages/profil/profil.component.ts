import { Component, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientNavbarComponent } from '../../../../shared/client-navbar/client-navbar.component';
import { ClientReservationService } from '../../../../core/services/client-reservation.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-client-profil',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ClientNavbarComponent],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.css',
})
export class ProfilComponent implements OnInit {
  onglet = signal<'profil' | 'preferences'>('profil');
  isSaving = signal(false);
  saveError = signal('');
  saveSuccess = signal('');

  // Préférence locale (pas d'endpoint backend dédié pour l'instant).
  recevoirNotifsEmail = signal(true);

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public reservationService: ClientReservationService,
    public themeService: ThemeService
  ) {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      numeroTelephone: ['', [Validators.required, Validators.pattern(/^6\d{8}$/)]],
      adresse: [''],
    });

    effect(() => {
      const c = this.reservationService.client();
      if (c) {
        this.form.patchValue({
          nom: c.nom, prenom: c.prenom, numeroTelephone: c.numeroTelephone, adresse: c.adresse ?? '',
        });
        const stored = this.lire(`notifsEmail_${c.email}`);
        if (stored !== null) this.recevoirNotifsEmail.set(stored === 'true');
      }
    });
  }

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('onglet') === 'preferences') {
      this.onglet.set('preferences');
    }
    if (!this.reservationService.client()) {
      this.reservationService.load();
    }
  }

  enregistrer() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');
    this.saveSuccess.set('');

    this.reservationService.updateProfile(this.form.value).subscribe({
      next: (res) => {
        this.reservationService.client.set(res.data);
        this.isSaving.set(false);
        this.saveSuccess.set('Profil mis à jour avec succès.');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err.error?.message || 'Erreur lors de la mise à jour du profil.');
      },
    });
  }

  toggleNotifsEmail() {
    this.recevoirNotifsEmail.update((v) => !v);
    const email = this.reservationService.client()?.email;
    if (email) {
      try {
        localStorage.setItem(`notifsEmail_${email}`, String(this.recevoirNotifsEmail()));
      } catch {}
    }
  }

  private lire(key: string): string | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}
