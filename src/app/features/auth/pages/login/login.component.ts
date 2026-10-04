import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  activeTab = signal<'ADMIN' | 'CLIENT'>('ADMIN');
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  setTab(tab: 'ADMIN' | 'CLIENT') {
    this.activeTab.set(tab);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
     next: (response) => {
    this.authService.saveSession(response);
    this.isLoading.set(false);
    switch (response.role) {
      case 'ADMIN':
        this.router.navigateByUrl('/admin/bookings');
        break;
      case 'CLIENT':
        this.router.navigateByUrl('/accueil');
        break;
      case 'AGENCE':
        // TODO: dashboard agence à construire (Naomie)
        this.router.navigateByUrl('/login');
        break;
    }
  },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Email ou mot de passe incorrect');
      },
    });
  }
}