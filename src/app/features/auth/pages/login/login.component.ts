import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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

  // on déclare juste le TYPE ici, sans valeur
  form: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    // on CONSTRUIT le formulaire ici, une fois que "fb" existe bel et bien
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
    console.log('Connexion', this.activeTab(), this.form.value);
    this.router.navigateByUrl('/admin/dashboard');
  }
}