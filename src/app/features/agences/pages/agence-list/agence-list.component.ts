import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgenceResponseDTO } from '../../../../models/agence.model';
import { AgenceService } from '../../../../services/agence/agence.service';

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
  totalOffres = 0;
  totalReservations = 0;

  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

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
    this.loadAgences();
  }

  loadAgences(): void {
    this.isLoading = true;
    this.agenceService.getAllAgences().subscribe({
      next: (data) => {
        this.agences = data;
        this.filteredAgences = data;
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