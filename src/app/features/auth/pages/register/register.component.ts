import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerType = signal<'CLIENT' | 'AGENCE'>('CLIENT');
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  clientForm: FormGroup;
  agenceForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.clientForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      numeroTelephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      adresse: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatchValidator });

    this.agenceForm = this.fb.group({
      nom: ['', Validators.required],
      adresse: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatchValidator });
  }

  setType(type: 'CLIENT' | 'AGENCE') {
    this.registerType.set(type);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  get activeForm(): FormGroup {
    return this.registerType() === 'CLIENT' ? this.clientForm : this.agenceForm;
  }

  submit() {
    const form = this.activeForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    // le backend n'attend pas confirmPassword, on le retire avant l'envoi
    const { confirmPassword, ...payload } = form.value;

    const request$ = this.registerType() === 'CLIENT'
      ? this.authService.registerClient(payload)
      : this.authService.registerAgence(payload);

    request$.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/login'], {
          queryParams: { type: this.registerType() }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error || 'Une erreur est survenue, veuillez réessayer');
      },
    });
  }
}