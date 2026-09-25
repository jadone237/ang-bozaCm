import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AgenceRequestDTO } from '../../models/agence.model';
import { AgenceService } from '../../services/agence/agence.service';

@Component({
  selector: 'app-agence-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './agence-form.component.html',
  styleUrls: ['./agence-form.component.scss']
})
export class AgenceFormComponent implements OnInit {
  agenceForm: AgenceRequestDTO = this.nouvelleAgence();
  isEditMode = false;
  agenceId?: number;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private agenceService: AgenceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Création du formulaire et de ses règles
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.agenceId = Number(id);
      this.chargerAgence();
    }
  }

  soumettreFormulaire(formulaire: NgForm): void {
    if (formulaire.invalid) {
      formulaire.control.markAllAsTouched();
      return;
    }

    const donneesAgence: AgenceRequestDTO = this.agenceForm;
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
      next: (agence) => this.agenceForm = { ...agence },
      error: (err) => this.errorMessage = err.message
    });
  }

  private nouvelleAgence(): AgenceRequestDTO {
    return { nom: '', email: '', telephone: '', adresse: '' };
  }
}