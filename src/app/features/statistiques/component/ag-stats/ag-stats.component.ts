import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AgenceClassementDTO, AgenceStatistiqueDTO, EvolutionAgenceDTO } from '../../model/stat.model';
import { GraphiqueMoisComponent } from '../graphique-mois/graphique-mois.component';
import { SqueletteComponent } from '../../../../shared/ui/squelette.component';
import { SatsService } from '../../service/sats.service';

@Component({
  selector: 'app-ag-stats',
  standalone: true,
  imports: [CommonModule, SqueletteComponent, GraphiqueMoisComponent],
  templateUrl: './ag-stats.component.html',
  styleUrl: './ag-stats.component.scss'
})
export class AgStatsComponent implements OnInit {
  private satsService = inject(SatsService);

  agenceId!: number;
  stats: AgenceStatistiqueDTO | null = null;
  classement: AgenceClassementDTO[] = [];
  evolution: EvolutionAgenceDTO | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam || isNaN(Number(idParam))) {
      this.errorMessage = 'Identifiant d’agence invalide.';
      this.isLoading = false;
      return;
    }

    this.agenceId = Number(idParam);
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      stats: this.satsService.getStatistiquesByAgenceId(this.agenceId),
      classement: this.satsService.getClassementAgences(),
      evolution: this.satsService.getEvolutionAgence(this.agenceId, 6)
    }).subscribe({
      next: ({ stats, classement, evolution }) => {
        this.stats = stats;
        this.classement = classement;
        this.evolution = evolution;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  // Permet de déterminer la largeur relative (%) pour le graphique à barres
  get maxReservations(): number {
    if (!this.classement.length) return 1;
    return Math.max(...this.classement.map((a) => a.nombreReservationsTotal), 1);
  }

  calculerPourcentage(totalReservations: number): number {
    return Math.round((totalReservations / this.maxReservations) * 100);
  }

  retourListe(): void {
    this.router.navigate(['/statistiques']);
  }
}