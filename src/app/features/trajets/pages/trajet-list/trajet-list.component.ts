import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrajetResponseDTO } from '../../../../models/trajet.model';
import { TrajetService } from '../../../../services/trajet/trajet.service';

@Component({
  selector: 'app-trajet-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trajet-list.component.html',
  styleUrl: './trajet-list.component.scss'
})
export class TrajetListComponent implements OnInit {
  trajets: TrajetResponseDTO[] = [];
  resultatsRecherche: TrajetResponseDTO[] = [];
  trajetsAffiches: TrajetResponseDTO[] = [];
  recherche = '';
  page = 1;
  taillePage = 4;
  totalPages = 1;
  isLoading = true;
  errorMessage = '';

  constructor(private trajetService: TrajetService) {}

  ngOnInit(): void {
    this.chargerTrajets();
  }

  chargerTrajets(): void {
    this.isLoading = true;
    this.trajetService.getAllTrajets().subscribe({
      next: (trajets) => {
        this.trajets = trajets;
        this.resultatsRecherche = trajets;
        this.page = 1;
        this.mettreAJourAffichage();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  rechercherTrajets(): void {
    const terme = this.recherche.trim().toLowerCase();
    this.resultatsRecherche = this.trajets.filter((trajet) =>
      !terme ||
      trajet.depart.toLowerCase().includes(terme) ||
      trajet.arrivee.toLowerCase().includes(terme)
    );
    this.page = 1;
    this.mettreAJourAffichage();
  }

  changerPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.page = page;
    this.mettreAJourAffichage();
  }

  get nombreVilles(): number {
    return new Set(this.trajets.flatMap((trajet) => [trajet.depart, trajet.arrivee])).size;
  }

  get nombreTypes(): number {
    const types = this.trajets
      .map((trajet) => trajet.type)
      .filter((type): type is string => Boolean(type));
    return new Set(types).size;
  }

  private mettreAJourAffichage(): void {
    const debut = (this.page - 1) * this.taillePage;
    const fin = debut + this.taillePage;
    this.totalPages = Math.max(1, Math.ceil(this.resultatsRecherche.length / this.taillePage));
    this.trajetsAffiches = this.resultatsRecherche.slice(debut, fin);
  }
}
