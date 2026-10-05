import { Component, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ClientNavbarComponent } from '../../../../shared/client-navbar/client-navbar.component';
import { ClientReservationService } from '../../../../core/services/client-reservation.service';
import { ThemeService } from '../../../../core/services/theme.service';

function motsDePasseIdentiques(group: AbstractControl): ValidationErrors | null {
  const nouveau = group.get('nouveauMotDePasse')?.value;
  const confirmation = group.get('confirmation')?.value;
  return nouveau === confirmation ? null : { motsDePasseDifferents: true };
}

@Component({
  selector: 'app-client-profil',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ClientNavbarComponent],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.css',
})
export class ProfilComponent implements OnInit {
  onglet = signal<'profil' | 'securite' | 'preferences'>('profil');
  isSaving = signal(false);
  saveError = signal('');
  saveSuccess = signal('');

  isChangingPassword = signal(false);
  passwordError = signal('');
  passwordSuccess = signal('');
  showPasswords = signal(false);

  // Préférence locale (pas d'endpoint backend dédié pour l'instant).
  recevoirNotifsEmail = signal(true);

  form: FormGroup;
  passwordForm: FormGroup;

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

    // Mêmes règles que ChangePasswordDTO côté backend (nouveau mot de passe : 6 caractères minimum).
    this.passwordForm = this.fb.group({
      ancienMotDePasse: ['', Validators.required],
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', Validators.required],
    }, { validators: motsDePasseIdentiques });

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
    const onglet = this.route.snapshot.queryParamMap.get('onglet');
    if (onglet === 'preferences' || onglet === 'securite') {
      this.onglet.set(onglet);
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

  changerMotDePasse() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { ancienMotDePasse, nouveauMotDePasse } = this.passwordForm.value;
    if (ancienMotDePasse === nouveauMotDePasse) {
      this.passwordError.set("Le nouveau mot de passe doit être différent de l'ancien.");
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordError.set('');
    this.passwordSuccess.set('');

    this.reservationService.changePassword(ancienMotDePasse, nouveauMotDePasse).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordForm.reset();
        this.passwordSuccess.set('Mot de passe modifié. Utilisez le nouveau mot de passe à votre prochaine connexion.');
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        // Erreur de validation backend : { message, errors: { champ: message } }
        const detail = err.error?.errors ? Object.values(err.error.errors)[0] : null;
        this.passwordError.set((detail as string) || err.error?.message || 'Erreur lors du changement de mot de passe.');
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
