import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrajetRequestDTO } from '../../../../models/trajet.model';
import { TrajetService } from '../../../../services/trajet/trajet.service';

@Component({
  selector: 'app-trajet-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trajet-form.component.html',
  styleUrls: ['./trajet-form.component.scss']
})
export class TrajetFormComponent implements OnInit {
  trajet: TrajetRequestDTO = { depart: '', arrivee: '' };
  trajetId?: number;
  isEditMode = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private trajetService: TrajetService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.trajetId = Number(id);
      this.chargerTrajet();
    }
  }

  enregistrer(): void {
    if (!this.trajet.depart.trim() || !this.trajet.arrivee.trim()) {
      this.errorMessage = 'Le départ et l’arrivée sont obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const requete = this.isEditMode && this.trajetId !== undefined
      ? this.trajetService.updateTrajet(this.trajetId, this.trajet)
      : this.trajetService.createTrajet(this.trajet);

    requete.subscribe({
      next: () => this.router.navigate(['/trajets'], {
        queryParams: {
          message: this.isEditMode
            ? 'Trajet modifié avec succès.'
            : 'Trajet créé avec succès.'
        }
      }),
      error: (error) => {
        this.errorMessage = error.message;
        this.isSubmitting = false;
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/trajets']);
  }

  private chargerTrajet(): void {
    if (this.trajetId === undefined) {
      return;
    }

    this.trajetService.getTrajetById(this.trajetId).subscribe({
      next: (trajet) => {
        this.trajet = {
          depart: trajet.depart,
          arrivee: trajet.arrivee
        };
      },
      error: (error) => this.errorMessage = error.message
    });
  }
}
