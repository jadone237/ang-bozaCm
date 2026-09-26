import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OffreRequestDTO } from '../../models/offre.model';
import { AgenceResponseDTO } from '../../../agences/models/agence.model';
import { TrajetResponseDTO } from '../../../trajets/models/trajet.model';
import { OffreService } from '../../data-access/offre.service';
import { AgenceService } from '../../../agences/data-access/agence.service';
import { TrajetService } from '../../../trajets/data-access/trajet.service';

@Component({
  selector: 'app-offre-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offre-form.component.html',
  styleUrl: './offre-form.component.scss'
})
export class OffreFormComponent implements OnInit {
  offre: OffreRequestDTO = this.nouvelleOffre();
  agences: AgenceResponseDTO[] = [];
  trajets: TrajetResponseDTO[] = [];
  offreId?: number;
  isEditMode = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private offreService: OffreService,
    private agenceService: AgenceService,
    private trajetService: TrajetService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.agenceService.getAllAgences().subscribe({
      next: (agences) => this.agences = agences,
      error: (error) => this.errorMessage = error.message
    });
    this.trajetService.getAllTrajets().subscribe({
      next: (trajets) => this.trajets = trajets,
      error: (error) => this.errorMessage = error.message
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.offreId = Number(id);
      this.chargerOffre();
    }
  }

  enregistrer(): void {
    if (!this.offre.titre.trim() || !this.offre.description.trim() ||
        this.offre.prix <= 0 || !this.offre.dateDepart || this.offre.nombrePlaces <= 0 ||
        !this.offre.agenceId || !this.offre.trajetId) {
      this.errorMessage = 'Renseignez tous les champs avec des valeurs valides.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const requete = this.isEditMode && this.offreId !== undefined
      ? this.offreService.updateOffre(this.offreId, this.offre)
      : this.offreService.createOffre(this.offre);

    requete.subscribe({
      next: () => this.router.navigate(['/offres'], {
        queryParams: { message: this.isEditMode ? 'Offre modifiée avec succès.' : 'Offre créée avec succès.' }
      }),
      error: (error) => {
        this.errorMessage = error.message;
        this.isSubmitting = false;
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/offres']);
  }

  private chargerOffre(): void {
    if (this.offreId === undefined) return;
    this.offreService.getOffreById(this.offreId).subscribe({
      next: (offre) => {
        this.offre = {
          titre: offre.titre,
          description: offre.description,
          prix: offre.prix,
          dateDepart: offre.dateDepart.slice(0, 10),
          nombrePlaces: offre.nombrePlaces,
          agenceId: offre.agence.id,
          trajetId: offre.trajet.id
        };
      },
      error: (error) => this.errorMessage = error.message
    });
  }

  private nouvelleOffre(): OffreRequestDTO {
    return { titre: '', description: '', prix: 0, dateDepart: '', nombrePlaces: 1, agenceId: 0, trajetId: 0 };
  }
}
