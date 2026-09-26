import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AgenceRequestDTO } from '../../models/agence.model';
import { AgenceService } from '../../data-access/agence.service';

@Component({
  selector: 'app-agence-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './agence-form.component.html',
  styleUrls: ['./agence-form.component.scss']
})
export class AgenceFormComponent implements OnInit {
  agenceForm!: FormGroup;
  isEditMode = false;
  agenceId?: number;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private agenceService: AgenceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.agenceForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required]],
      adresse: ['', [Validators.required]]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.agenceId = Number(id);
      this.chargerAgence();
    }
  }

  get f() {
    return this.agenceForm.controls;
  }

  soumettreFormulaire(): void {
    if (this.agenceForm.invalid) {
      this.agenceForm.markAllAsTouched();
      return;
    }

    const donneesAgence: AgenceRequestDTO = this.agenceForm.value;
    this.isSubmitting = true;
    this.errorMessage = '';

    const requete = this.isEditMode && this.agenceId !== undefined
      ? this.agenceService.updateAgence(this.agenceId, donneesAgence)
      : this.agenceService.createAgence(donneesAgence);

    requete.subscribe({
      next: () => this.router.navigate(['/agences'], {
        queryParams: {
          message: this.isEditMode
            ? 'Agence modifiée avec succès.'
            : 'Agence créée avec succès.'
        }
      }),
      error: (err) => {
        this.errorMessage = err.message;
        this.isSubmitting = false;
      }
    });
  }

  private chargerAgence(): void {
    if (this.agenceId === undefined) {
      return;
    }

    this.agenceService.getAgenceById(this.agenceId).subscribe({
      next: (agence) => this.agenceForm.patchValue(agence),
      error: (err) => this.errorMessage = err.message
    });
  }
}