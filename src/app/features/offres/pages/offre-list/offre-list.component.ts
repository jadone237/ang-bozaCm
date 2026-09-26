import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OffreResponseDTO } from '../../models/offre.model';
import { AgenceResponseDTO } from '../../../agences/models/agence.model';
import { OffreService } from '../../data-access/offre.service';
import { AgenceService } from '../../../agences/data-access/agence.service';

@Component({
  selector: 'app-offre-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './offre-list.component.html',
  styleUrl: './offre-list.component.scss'
})
export class OffreListComponent implements OnInit {
  offres: OffreResponseDTO[] = [];
  offresFiltrees: OffreResponseDTO[] = [];
  agences: AgenceResponseDTO[] = [];
  recherche = '';
  villeSelectionnee = '';
  agenceSelectionnee = '';
  page = 1;
  readonly taillePage = 4;
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private offreService: OffreService,
    private agenceService: AgenceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.successMessage = this.route.snapshot.queryParamMap.get('message') || '';
    if (this.successMessage) {
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
    this.chargerOffres();
    this.agenceService.getAllAgences().subscribe({ next: (agences) => this.agences = agences });
  }

  chargerOffres(): void {
    this.isLoading = true;
    this.offreService.getAllOffres().subscribe({
      next: (offres) => {
        this.offres = offres;
        this.filtrerOffres();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  filtrerOffres(): void {
    const terme = this.recherche.trim().toLocaleLowerCase();
    this.offresFiltrees = this.offres.filter((offre) => {
      const correspondAuTexte = !terme || [
        offre.titre,
        offre.description,
        offre.agence.nom,
        offre.trajet.villeDepart,
        offre.trajet.villeArrivee
      ].some((valeur) => valeur?.toLocaleLowerCase().includes(terme));
      const correspondVille = !this.villeSelectionnee || offre.trajet.villeDepart === this.villeSelectionnee;
      const correspondAgence = !this.agenceSelectionnee || offre.agence.id === Number(this.agenceSelectionnee);
      return correspondAuTexte && correspondVille && correspondAgence;
    });
    this.page = 1;
  }

  get offresAffichees(): OffreResponseDTO[] {
    const debut = (this.page - 1) * this.taillePage;
    return this.offresFiltrees.slice(debut, debut + this.taillePage);
  }

  get nombrePages(): number {
    return Math.max(1, Math.ceil(this.offresFiltrees.length / this.taillePage));
  }

  get pages(): number[] {
    return Array.from({ length: this.nombrePages }, (_, index) => index + 1);
  }

  get villesDepart(): string[] {
    return [...new Set(this.offres.map((offre) => offre.trajet.villeDepart))].sort();
  }

  get nombreOffresActives(): number {
    const aujourdHui = new Date().toISOString().slice(0, 10);
    return this.offres.filter((offre) => offre.dateDepart >= aujourdHui).length;
  }

  get nombrePlacesDisponibles(): number {
    return this.offres.reduce((total, offre) => total + offre.placesDisponibles, 0);
  }

  changerPage(nouvellePage: number): void {
    if (nouvellePage >= 1 && nouvellePage <= this.nombrePages) this.page = nouvellePage;
  }

  supprimerOffre(id: number): void {
    if (!confirm('Voulez-vous vraiment supprimer cette offre ?')) return;
    this.offreService.deleteOffre(id).subscribe({
      next: () => {
        this.successMessage = 'Offre supprimée avec succès.';
        this.chargerOffres();
      },
      error: (error: any) => this.errorMessage = error.message
    });
  }
}
