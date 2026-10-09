import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { OffreResponseDTO, OffreResumeDTO } from '../../models/offre.model';
import { AgenceResponseDTO } from '../../../agences/models/agence.model';
import { OffreService } from '../../data-access/offre.service';
import { AgenceService } from '../../../agences/data-access/agence.service';
import { TrajetService } from '../../../trajets/data-access/trajet.service';
import { NotificationService } from '../../../../shared/ui/notification.service';
import { SqueletteComponent } from '../../../../shared/ui/squelette.component';

@Component({
  selector: 'app-offre-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SqueletteComponent],
  templateUrl: './offre-list.component.html',
  styleUrl: './offre-list.component.scss'
})
export class OffreListComponent implements OnInit, OnDestroy {
  private offreService = inject(OffreService);
  private agenceService = inject(AgenceService);
  private trajetService = inject(TrajetService);
  private notifications = inject(NotificationService);

  // La page courante est chargée depuis le serveur (pagination + filtres côté backend)
  offresAffichees: OffreResponseDTO[] = [];
  totalOffresFiltrees = 0;
  nombrePages = 1;
  resume: OffreResumeDTO = { totalOffres: 0, offresActives: 0, placesRestantes: 0 };
  agences: AgenceResponseDTO[] = [];
  villesDepart: string[] = [];
  recherche = '';
  villeSelectionnee = '';
  agenceSelectionnee = '';
  page = 1;
  readonly taillePage = 5;
  isLoading = true;
  errorMessage = '';

  private rechercheSaisie = new Subject<void>();
  private abonnementRecherche?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const message = this.route.snapshot.queryParamMap.get('message');
    if (message) {
      this.notifications.succes(message);
      // Retire ?message= de l'adresse pour ne pas le réafficher au rafraîchissement
      this.router.navigate([], { relativeTo: this.route, queryParams: { message: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
    // On attend une courte pause dans la frappe avant d'interroger le serveur
    this.abonnementRecherche = this.rechercheSaisie.pipe(debounceTime(300)).subscribe(() => this.filtrerOffres());

    this.chargerOffres();
    this.chargerResume();
    this.agenceService.getAllAgences().subscribe({ next: (agences) => this.agences = agences });
    this.trajetService.getAllTrajets().subscribe({
      next: (trajets) => this.villesDepart = [...new Set(trajets.map((t) => t.villeDepart))].sort()
    });
  }

  ngOnDestroy(): void {
    this.abonnementRecherche?.unsubscribe();
  }

  chargerOffres(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.offreService.rechercherOffres({
      motCle: this.recherche.trim(),
      villeDepart: this.villeSelectionnee,
      agenceId: this.agenceSelectionnee ? Number(this.agenceSelectionnee) : undefined
    }, this.page - 1, this.taillePage).subscribe({
      next: (resultat) => {
        this.offresAffichees = resultat.content;
        this.totalOffresFiltrees = resultat.totalElements;
        this.nombrePages = Math.max(1, resultat.totalPages);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  private chargerResume(): void {
    this.offreService.getResume().subscribe({ next: (resume) => this.resume = resume });
  }

  /** Appelé à chaque frappe dans la recherche (attend 300 ms avant d'interroger le serveur). */
  saisirRecherche(): void {
    this.rechercheSaisie.next();
  }

  filtrerOffres(): void {
    this.page = 1;
    this.chargerOffres();
  }

  get pages(): number[] {
    return Array.from({ length: this.nombrePages }, (_, index) => index + 1);
  }

  /** Libellé de la colonne « Places » : départ passé, complet, peu de places ou nombre restant. */
  libellePlaces(offre: OffreResponseDTO): string {
    const n = offre.placesDisponibles ?? 0;
    if (this.estPassee(offre)) return 'Départ passé';
    if (n <= 0) return 'Complet';
    if (n <= 5) return `Plus que ${n}`;
    return `${n} dispo`;
  }

  /** Classe CSS du badge de places, dans le même ordre de priorité que le libellé. */
  etatPlaces(offre: OffreResponseDTO): string {
    if (this.estPassee(offre)) return 'depart-passe';
    const n = offre.placesDisponibles ?? 0;
    if (n <= 0) return 'complet';
    if (n <= 5) return 'peu-places';
    return '';
  }

  /** Part des places déjà réservées, en pourcentage (barre de remplissage). */
  tauxRemplissage(offre: OffreResponseDTO): number {
    if (!offre.nombrePlaces) return 0;
    const reservees = offre.nombrePlaces - (offre.placesDisponibles ?? 0);
    return Math.round((reservees / offre.nombrePlaces) * 100);
  }

  estPassee(offre: OffreResponseDTO): boolean {
    const d = new Date();
    const aujourdHui = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return offre.dateDepart.slice(0, 10) < aujourdHui;
  }

  changerPage(nouvellePage: number): void {
    if (nouvellePage >= 1 && nouvellePage <= this.nombrePages && nouvellePage !== this.page) {
      this.page = nouvellePage;
      this.chargerOffres();
    }
  }

  async supprimerOffre(offre: OffreResponseDTO): Promise<void> {
    const confirme = await this.notifications.confirmer({
      titre: 'Supprimer l’offre',
      message: `Voulez-vous vraiment supprimer l’offre « ${offre.titre} » ? Cette action est définitive.`,
      libelleConfirmer: 'Supprimer'
    });
    if (!confirme) return;
    this.offreService.deleteOffre(offre.id).subscribe({
      next: () => {
        this.notifications.succes('Offre supprimée avec succès.');
        // Revient à la page précédente si on vient de vider la dernière page
        if (this.offresAffichees.length === 1 && this.page > 1) this.page--;
        this.chargerOffres();
        this.chargerResume();
      },
      error: (error: any) => this.notifications.erreur(error.message)
    });
  }
}
