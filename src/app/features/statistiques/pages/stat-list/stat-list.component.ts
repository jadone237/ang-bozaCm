import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgenceResponseDTO } from '../../../agences/models/agence.model';
import { AgenceService } from '../../../agences/data-access/agence.service';

@Component({
  selector: 'app-stat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stat-list.component.html',
  styleUrl: './stat-list.component.scss'
})
export class StatListComponent implements OnInit {
  agences: AgenceResponseDTO[] = [];
  agencesFiltrees: AgenceResponseDTO[] = [];

  recherche = '';
  villeSelectionnee = '';

  page = 1;
  readonly taillePage = 5;

  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private agenceService: AgenceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.successMessage = this.route.snapshot.queryParamMap.get('message') || '';
    if (this.successMessage) {
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
    this.chargerAgences();
  }

  chargerAgences(): void {
    this.isLoading = true;
    this.agenceService.getAllAgences().subscribe({
      next: (agences) => {
        this.agences = agences;
        this.filtrerAgences();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  filtrerAgences(): void {
    const terme = this.recherche.trim().toLowerCase();
    this.agencesFiltrees = this.agences.filter((agence) => {
      const correspondTexte = !terme || [
        agence.nom,
        agence.email,
        agence.telephone,
        agence.adresse,
        agence.ville
      ].some((valeur) => valeur?.toLowerCase().includes(terme));

      const correspondVille = !this.villeSelectionnee || agence.ville === this.villeSelectionnee;

      return correspondTexte && correspondVille;
    });
    this.page = 1;
  }

  // --- Getters de Pagination ---
  get agencesAffichees(): AgenceResponseDTO[] {
    const debut = (this.page - 1) * this.taillePage;
    return this.agencesFiltrees.slice(debut, debut + this.taillePage);
  }

  get nombrePages(): number {
    return Math.max(1, Math.ceil(this.agencesFiltrees.length / this.taillePage));
  }

  get pages(): number[] {
    return Array.from({ length: this.nombrePages }, (_, index) => index + 1);
  }

  // --- Getters Statistiques / Filtres ---
  get villesDisponibles(): string[] {
    return [...new Set(this.agences.map((a) => a.ville).filter(Boolean) as string[])].sort();
  }

  get totalAgences(): number {
    return this.agences.length;
  }

  changerPage(nouvellePage: number): void {
    if (nouvellePage >= 1 && nouvellePage <= this.nombrePages) {
      this.page = nouvellePage;
    }
  }

  voirStatistiques(agenceId: number): void {
    this.router.navigate(['/statistiques', agenceId, 'statistiques']);
  }

  supprimerAgence(id: number): void {
    if (!confirm('Voulez-vous vraiment supprimer cette agence ?')) return;

    this.agenceService.deleteAgence(id).subscribe({
      next: () => {
        this.successMessage = 'Agence supprimée avec succès.';
        this.chargerAgences();
      },
      error: (error: any) => {
        this.errorMessage = error.message;
      }
    });
  }
}
