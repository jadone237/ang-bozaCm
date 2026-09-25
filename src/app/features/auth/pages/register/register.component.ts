import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// validateur réutilisable pour les deux formulaires
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

  clientForm: FormGroup;
  agenceForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    // champs alignés sur Client.java
    this.clientForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      numeroTelephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      adresse: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatchValidator });

    // champs alignés sur Agence.java
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
    // TODO : appeler AuthService.register(this.registerType(), form.value)
    // une fois le endpoint d'inscription confirmé avec Naomie
    console.log('Inscription', this.registerType(), form.value);
    this.router.navigateByUrl('/login');
  }
}