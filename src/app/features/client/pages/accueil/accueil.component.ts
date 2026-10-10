import { Component, OnInit, computed, signal } from '@angular/core';
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

/** En dessous de ce seuil, on prévient le voyageur qu'il reste peu de places. */
const SEUIL_PEU_DE_PLACES = 5;

interface FiltresRecherche {
  transport: 'BUS' | 'AVION' | 'TRAIN';
  depart: string;
  destination: string;
  date: string;
}

/** Minuscules sans accents, pour que « yaounde » trouve « Yaoundé ». */
function normaliser(texte: string | undefined | null): string {
  return (texte ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Date du jour au format AAAA-MM-JJ (heure locale), comparable aux dates des offres. */
function aujourdhui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
  readonly dateMin = aujourdhui();
  // null tant que le voyageur n'a pas lancé de recherche : toutes les offres à venir sont affichées
  filtres = signal<FiltresRecherche | null>(null);

  /** Offres disponibles en premier, puis expirées, filtrées par la recherche. */
  offresAffichees = computed(() => {
    const f = this.filtres();
    return this.offres()
      .filter((o) => !f || this.correspond(o, f))
      .sort((a, b) => {
        const disponibilite = Number(this.estPassee(a)) - Number(this.estPassee(b));
        return disponibilite || a.dateDepart.localeCompare(b.dateDepart);
      });
  });

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
    const { depart, destination, date } = this.searchForm.value;
    this.filtres.set({ transport: this.activeTransport(), depart, destination, date });
  }

  effacerRecherche() {
    this.searchForm.reset({ depart: '', destination: '', date: '' });
    this.filtres.set(null);
  }

  private correspond(offre: Offre, f: FiltresRecherche): boolean {
    // Les anciennes offres sans typeTransport sont des offres de bus
    if ((offre.typeTransport ?? 'BUS') !== f.transport) return false;
    if (f.depart && !normaliser(offre.trajet?.villeDepart).includes(normaliser(f.depart))) return false;
    if (f.destination && !normaliser(offre.trajet?.villeArrivee).includes(normaliser(f.destination))) return false;
    if (f.date && offre.dateDepart.slice(0, 10) < f.date) return false;
    return true;
  }

  estPassee(offre: Offre): boolean {
    return offre.dateDepart.slice(0, 10) < this.dateMin;
  }

  estComplete(offre: Offre): boolean {
    return (offre.placesDisponibles ?? 0) <= 0;
  }

  /** Statut de disponibilité de l'offre, puis nombre de places restantes. */
  badgePlaces(offre: Offre): string {
    if (this.estPassee(offre)) return 'Offre expirée';
    const n = offre.placesDisponibles ?? 0;
    if (n <= 0) return 'Complet';
    if (n <= SEUIL_PEU_DE_PLACES) return n === 1 ? 'Plus qu’1 place' : `Plus que ${n} places`;
    return `${n} places`;
  }

  /** Couleur du badge : rouge si complet, ambre s'il reste peu de places, sinon la couleur de la carte. */
  badgeClassPlaces(offre: Offre, index: number): string {
    if (this.estPassee(offre)) return 'badge-expired';
    const n = offre.placesDisponibles ?? 0;
    if (n <= 0) return 'badge-red';
    if (n <= SEUIL_PEU_DE_PLACES) return 'badge-warn';
    return this.badgeClass(index);
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
