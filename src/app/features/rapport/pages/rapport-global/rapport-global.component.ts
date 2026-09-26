import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RapportService } from '../../service/rapport.service';
import { RapportGlobalDTO } from '../../model/rapport.model';

@Component({
  selector: 'app-rapport-global',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rapport-global.component.html',
  styleUrl: './rapport-global.component.scss'
})
export class RapportGlobalComponent implements OnInit {
  rapport: RapportGlobalDTO | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private rapportService: RapportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerRapport();
  }

  chargerRapport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rapportService.getRapportGlobal().subscribe({
      next: (data) => {
        this.rapport = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  // Calcul du taux des réservations en attente
  get tauxEnAttente(): number {
    if (!this.rapport || this.rapport.totalReservations === 0) return 0;
    return Math.round((this.rapport.totalEnAttente / this.rapport.totalReservations) * 100);
  }

  // Calcul du taux des réservations annulées
  get tauxAnnulees(): number {
    if (!this.rapport || this.rapport.totalReservations === 0) return 0;
    return Math.round((this.rapport.totalAnnulees / this.rapport.totalReservations) * 100);
  }

  // Style CSS pour le graphique circulaire conique
  get jaugeConique(): string {
    const confirme = this.rapport?.tauxConfirmation || 0;
    const attente = this.tauxEnAttente;
    const limite1 = confirme;
    const limite2 = confirme + attente;

    return `conic-gradient(#007f78 0% ${limite1}%, #f3ba70 ${limite1}% ${limite2}%, #d9383a ${limite2}% 100%)`;
  }

  allerVersAgences(): void {
    this.router.navigate(['/agences']);
  }

  exporterBilan(): void {
    window.print();
  }
}