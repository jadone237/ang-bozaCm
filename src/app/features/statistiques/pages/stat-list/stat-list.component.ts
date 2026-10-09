import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgenceResponseDTO } from '../../../agences/models/agence.model';
import { AgenceService } from '../../../agences/data-access/agence.service';
import { NotificationService } from '../../../../shared/ui/notification.service';
import { SqueletteComponent } from '../../../../shared/ui/squelette.component';

@Component({
  selector: 'app-stat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SqueletteComponent],
  templateUrl: './stat-list.component.html',
  styleUrl: './stat-list.component.scss'
})
export class StatListComponent implements OnInit, OnDestroy {
  private agenceService = inject(AgenceService);
  private notifications = inject(NotificationService);

  agences: AgenceResponseDTO[] = [];
  agencesFiltrees: AgenceResponseDTO[] = [];

  recherche = '';
  villeSelectionnee = '';

  page = 1;
  readonly taillePage = 5;

  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const message = this.route.snapshot.queryParamMap.get('message');
    if (message) {
      this.afficherSucces(message);
    }
    this.chargerAgences();
  }

  ngOnDestroy(): void {
  }

  private afficherSucces(message: string): void {
    this.notifications.succes(message);
    if (this.route.snapshot.queryParamMap.has('message')) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { message: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
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

  async supprimerAgence(id: number): Promise<void> {
    const confirme = await this.notifications.confirmer({
      titre: 'Supprimer l’agence',
      message: 'Voulez-vous vraiment supprimer cette agence ? Cette action est définitive.',
      libelleConfirmer: 'Supprimer'
    });
    if (!confirme) return;

    this.agenceService.deleteAgence(id).subscribe({
      next: () => {
        this.afficherSucces('Agence supprimée avec succès.');
        this.chargerAgences();
      },
      error: (error: any) => this.notifications.erreur(error.message)
    });
  }
}
