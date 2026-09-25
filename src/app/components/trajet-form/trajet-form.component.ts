import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrajetRequestDTO } from '../../models/trajet.model';
import { TrajetService } from '../../services/trajet/trajet.service';

@Component({
  selector: 'app-trajet-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trajet-form.component.html',
  styleUrls: ['./trajet-form.component.scss']
})
export class TrajetFormComponent implements OnInit {
  trajet: TrajetRequestDTO = {
    villeDepart: '',
    villeArrivee: '',
    duree: ''
  };
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
    if (!this.trajet.villeDepart.trim() ||
        !this.trajet.villeArrivee.trim() ||
        !this.trajet.duree.trim()) {
      this.errorMessage = 'Le départ, l’arrivée et la durée sont obligatoires.';
      return;
    }

    if (this.trajet.villeDepart.trim().toLowerCase() === this.trajet.villeArrivee.trim().toLowerCase()) {
      this.errorMessage = 'La ville de départ et la ville d’arrivée doivent être différentes.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const donnees = {
      villeDepart: this.trajet.villeDepart.trim(),
      villeArrivee: this.trajet.villeArrivee.trim(),
      duree: this.trajet.duree.trim()
    };
    const requete = this.isEditMode && this.trajetId !== undefined
      ? this.trajetService.updateTrajet(this.trajetId, donnees)
      : this.trajetService.createTrajet(donnees);

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
          villeDepart: trajet.villeDepart,
          villeArrivee: trajet.villeArrivee,
          duree: trajet.duree
        };
      },
      error: (error) => this.errorMessage = error.message
    });
  }
}
