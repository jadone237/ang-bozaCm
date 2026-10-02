import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgenceResponseDTO } from '../../models/agence.model';
import { AgenceService } from '../../data-access/agence.service';
import { OffreService } from '../../../offres/data-access/offre.service';
import { ReservationAdminService } from '../../../admin/services/reservation-admin.service';

@Component({
  selector: 'app-agence-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agence-list.component.html',
  styleUrls: ['./agence-list.component.scss']
})
export class AgenceListComponent implements OnInit {
  agences: AgenceResponseDTO[] = [];
  filteredAgences: AgenceResponseDTO[] = [];
  searchTerm: string = '';
  page = 1;
  readonly pageSize = 4;
  totalOffres = 0;
  totalReservations = 0;
  statsErrorMessage = '';

  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private agenceService: AgenceService,
    private offreService: OffreService,
    private reservationService: ReservationAdminService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.successMessage = this.route.snapshot.queryParamMap.get('message') || '';
    if (this.successMessage) {
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
    this.loadAgences();
    this.loadSummaryCounts();
  }

  private loadSummaryCounts(): void {
    this.offreService.getAllOffres().subscribe({
      next: (offres) => this.totalOffres = offres.length,
      error: (error) => this.addStatsError('offres', error.status)
    });

    this.reservationService.getAllReservations().subscribe({
      next: (response) => this.totalReservations = this.countRecords(response),
      error: (error) => this.addStatsError('réservations', error.status)
    });
  }

  private addStatsError(resource: string, status: number): void {
    const detail = status ? ` (HTTP ${status})` : '';
    const message = `Impossible de charger le nombre de ${resource}${detail}.`;
    this.statsErrorMessage = [this.statsErrorMessage, message].filter(Boolean).join(' ');
  }

  private countRecords(response: unknown): number {
    if (Array.isArray(response)) return response.length;
    if (!response || typeof response !== 'object') return 0;

    const result = response as {
      data?: unknown;
      content?: unknown;
      total?: unknown;
      totalElements?: unknown;
      totalReservations?: unknown;
    };

    if (typeof result.totalReservations === 'number') return result.totalReservations;
    if (typeof result.totalElements === 'number') return result.totalElements;
    if (typeof result.total === 'number') return result.total;
    if (Array.isArray(result.data)) return result.data.length;
    if (Array.isArray(result.content)) return result.content.length;
    if (result.data && typeof result.data === 'object') {
      const nestedCount = this.countRecords(result.data);
      if (nestedCount > 0) return nestedCount;
    }
    return 0;
  }

  loadAgences(): void {
    this.isLoading = true;
    this.agenceService.getAllAgences().subscribe({
      next: (data) => {
        this.agences = data;
        this.filteredAgences = data;
        this.page = 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.page = 1;

    if (!term) {
      this.filteredAgences = this.agences;
      return;
    }

    this.filteredAgences = this.agences.filter((agence) =>
      agence.nom.toLowerCase().includes(term) ||
      agence.email.toLowerCase().includes(term) ||
      agence.telephone.toLowerCase().includes(term)
    );
  }

  get agencesAffichees(): AgenceResponseDTO[] {
    const debut = (this.page - 1) * this.pageSize;
    return this.filteredAgences.slice(debut, debut + this.pageSize);
  }

  get nombrePages(): number {
    return Math.max(1, Math.ceil(this.filteredAgences.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.nombrePages }, (_, index) => index + 1);
  }

  changerPage(nouvellePage: number): void {
    if (nouvellePage >= 1 && nouvellePage <= this.nombrePages) {
      this.page = nouvellePage;
    }
  }

  getInitials(name: string): string {
    if (!name) return 'AG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  deleteAgence(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cette agence ?')) {
      this.agenceService.deleteAgence(id).subscribe({
        next: () => {
          this.successMessage = 'Agence supprimée avec succès.';
          this.loadAgences();
        },
        error: (err) => {
          this.errorMessage = err.message;
        }
      });
    }
  }
}