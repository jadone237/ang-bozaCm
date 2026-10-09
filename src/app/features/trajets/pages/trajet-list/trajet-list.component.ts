import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrajetResponseDTO } from '../../models/trajet.model';
import { TrajetService } from '../../data-access/trajet.service';
import { NotificationService } from '../../../../shared/ui/notification.service';
import { SqueletteComponent } from '../../../../shared/ui/squelette.component';

@Component({
  selector: 'app-trajet-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SqueletteComponent],
  templateUrl: './trajet-list.component.html',
  styleUrl: './trajet-list.component.scss'
})
export class TrajetListComponent implements OnInit, OnDestroy {
  private trajetService = inject(TrajetService);
  private notifications = inject(NotificationService);

  trajets: TrajetResponseDTO[] = [];
  resultatsRecherche: TrajetResponseDTO[] = [];
  trajetsAffiches: TrajetResponseDTO[] = [];
  recherche = '';
  page = 1;
  taillePage = 4;
  totalPages = 1;
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
    this.chargerTrajets();
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
      trajet.villeDepart.toLowerCase().includes(terme) ||
      trajet.villeArrivee.toLowerCase().includes(terme) ||
      trajet.duree.toLowerCase().includes(terme)
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

  async supprimerTrajet(id: number): Promise<void> {
    const confirme = await this.notifications.confirmer({
      titre: 'Supprimer le trajet',
      message: 'Voulez-vous vraiment supprimer ce trajet ? Cette action est définitive.',
      libelleConfirmer: 'Supprimer'
    });
    if (!confirme) return;

    this.trajetService.deleteTrajet(id).subscribe({
      next: () => {
        this.afficherSucces('Trajet supprimé avec succès.');
        this.chargerTrajets();
      },
      error: (error) => this.notifications.erreur(error.message)
    });
  }

  get nombreVilles(): number {
    return new Set(this.trajets.flatMap((trajet) => [trajet.villeDepart, trajet.villeArrivee])).size;
  }

  get nombreDureesRenseignees(): number {
    return this.trajets.filter((trajet) => trajet.duree.trim().length > 0).length;
  }

  private mettreAJourAffichage(): void {
    const debut = (this.page - 1) * this.taillePage;
    const fin = debut + this.taillePage;
    this.totalPages = Math.max(1, Math.ceil(this.resultatsRecherche.length / this.taillePage));
    this.trajetsAffiches = this.resultatsRecherche.slice(debut, fin);
  }
}
