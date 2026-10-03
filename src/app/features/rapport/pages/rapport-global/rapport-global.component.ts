import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { RapportService } from '../../service/rapport.service';
import { RapportGlobalDTO } from '../../model/rapport.model';
import { SatsService } from '../../../statistiques/service/sats.service';

@Component({
  selector: 'app-rapport-global',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rapport-global.component.html',
  styleUrl: './rapport-global.component.scss'
})
export class RapportGlobalComponent implements OnInit {
  private rapportService = inject(RapportService);
  private satsService = inject(SatsService);

  rapport: RapportGlobalDTO | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerRapport();
  }

  chargerRapport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      rapport: this.rapportService.getRapportGlobal(),
      classement: this.satsService.getClassementAgences().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ rapport, classement }) => {
        const reservationsClassement = classement.reduce(
          (total, agence) => total + agence.nombreReservationsTotal,
          0
        );
        const confirmeesClassement = classement.reduce(
          (total, agence) => total + agence.nombreReservationsConfirmees,
          0
        );
        const totalReservations = Math.max(rapport.totalReservations || 0, reservationsClassement);
        const totalConfirmees = Math.max(rapport.totalConfirmees || 0, confirmeesClassement);

        this.rapport = {
          ...rapport,
          totalReservations,
          totalConfirmees,
          tauxConfirmation: rapport.tauxConfirmation || (totalReservations
            ? Math.round((totalConfirmees / totalReservations) * 100)
            : 0)
        };
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