import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, AdminProfile } from '../../services/admin.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  activeTab = signal<'profil' | 'preferences'>('profil');

  profile = signal<AdminProfile | null>(null);
  isLoading = signal(true);
  loadError = signal('');

  photoPreview = signal<string | null>(null);
  selectedFile: File | null = null;
  isUploadingPhoto = signal(false);
  photoError = signal('');

  isSaving = signal(false);
  saveError = signal('');
  saveSuccess = signal('');

  // Préférence purement locale (pas d'endpoint backend dédié) : on garde le scope minimal
  // comme demandé, sans inventer un système de réglages qui n'existe pas encore côté serveur.
  recevoirNotifsEmail = signal(true);

  profileForm: FormGroup;

  constructor(private fb: FormBuilder, private adminService: AdminService, private authService: AuthService) {
    this.profileForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    this.adminService.getMe().subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.profileForm.patchValue({ nom: res.data.nom, email: res.data.email });
        this.isLoading.set(false);

        const prefKey = `notifsEmail_${res.data.email}`;
        const stored = localStorage.getItem(prefKey);
        if (stored !== null) {
          this.recevoirNotifsEmail.set(stored === 'true');
        }
      },
      error: () => {
        this.loadError.set('Impossible de charger le profil pour le moment.');
        this.isLoading.set(false);
      },
    });
  }

  setTab(tab: 'profil' | 'preferences') {
    this.activeTab.set(tab);
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.photoError.set('');
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.photoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  confirmerPhoto() {
    if (!this.selectedFile) return;

    this.isUploadingPhoto.set(true);
    this.photoError.set('');

    this.adminService.uploadPhoto(this.selectedFile).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.photoPreview.set(null);
        this.selectedFile = null;
        this.isUploadingPhoto.set(false);
      },
      error: (err) => {
        this.photoError.set(err.error?.message || "Erreur lors de l'envoi de la photo.");
        this.isUploadingPhoto.set(false);
      },
    });
  }

  annulerPhoto() {
    this.photoPreview.set(null);
    this.selectedFile = null;
    this.photoError.set('');
  }

  enregistrerProfil() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');
    this.saveSuccess.set('');

    this.adminService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.isSaving.set(false);
        this.saveSuccess.set('Profil mis à jour avec succès.');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err.error?.message || 'Erreur lors de la mise à jour du profil.');
      },
    });
  }

  logout() {
    this.authService.logout();
  }

  toggleNotifsEmail() {
    this.recevoirNotifsEmail.update((v) => !v);
    const email = this.profile()?.email;
    if (email) {
      localStorage.setItem(`notifsEmail_${email}`, String(this.recevoirNotifsEmail()));
    }
  }
}
