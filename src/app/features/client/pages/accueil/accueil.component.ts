import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OffreService, Offre } from '../../../../core/services/offre.service';
import { ClientNavbarComponent } from '../../../../shared/client-navbar/client-navbar.component';

// Rotation purement visuelle (couleur de la carte / du badge) — aucune donnée fictive,
// juste de la variété de style tant que le backend n'expose pas de catégorie d'offre.
const ACCENTS = ['accent-navy', 'accent-teal', 'accent-green'];
const BADGES = ['badge-grey', 'badge-amber', 'badge-green'];
const BUTTONS = ['btn-navy', 'btn-teal', 'btn-green'];

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ClientNavbarComponent],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css',
})
export class AccueilComponent implements OnInit {
  activeTransport = signal<'BUS' | 'AVION' | 'TRAIN'>('BUS');
  // Données réelles uniquement : plus de tableau en dur. Tant que le backend ne renvoie
  // rien, la section reste vide (état isLoadingOffres / loadOffresError / liste vide).
  offres = signal<Offre[]>([]);
  isLoadingOffres = signal(true);
  loadOffresError = signal('');

  searchForm: FormGroup;

  constructor(private fb: FormBuilder, private offreService: OffreService) {
    this.searchForm = this.fb.group({
      depart: [''],
      destination: [''],
      date: [''],
    });
  }

  ngOnInit(): void {
    this.offreService.getAll().subscribe({
      next: (offres) => {
        this.offres.set(offres ?? []);
        this.isLoadingOffres.set(false);
      },
      error: () => {
        this.loadOffresError.set('Impossible de charger les offres pour le moment.');
        this.isLoadingOffres.set(false);
      },
    });
  }

  setTransport(type: 'BUS' | 'AVION' | 'TRAIN') {
    this.activeTransport.set(type);
  }

  search() {
    console.log('Recherche', this.activeTransport(), this.searchForm.value);
  }

  
 typeReservation(offre: Offre): 'bus' | 'train' | 'avion' {
  switch (offre.typeTransport) {
    case 'TRAIN': return 'train';
    case 'AVION': return 'avion';
    case 'BUS':
    default: return 'bus'; // couvre aussi les anciennes offres sans typeTransport
  }
}

  accentClass(index: number): string {
    return ACCENTS[index % ACCENTS.length];
  }

  badgeClass(index: number): string {
    return BADGES[index % BADGES.length];
  }

  boutonClass(index: number): string {
    return BUTTONS[index % BUTTONS.length];
  }
}
