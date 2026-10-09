import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoisStatistiqueDTO } from '../../model/stat.model';

/**
 * Histogramme mois par mois d'une seule mesure (réservations ou chiffre d'affaires).
 * Une mesure par graphique : jamais deux échelles différentes sur le même axe.
 * Le survol ou le focus clavier d'une colonne affiche le détail du mois.
 */
@Component({
  selector: 'app-graphique-mois',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graphique-mois.component.html',
  styleUrl: './graphique-mois.component.scss'
})
export class GraphiqueMoisComponent {
  mois = input.required<MoisStatistiqueDTO[]>();
  mesure = input.required<'reservations' | 'chiffreAffaire'>();

  maximum = computed(() => Math.max(...this.mois().map((m) => m[this.mesure()]), 1));

  valeur(m: MoisStatistiqueDTO): number {
    return m[this.mesure()];
  }

  /** Hauteur d'une barre en % de la zone du graphique (au moins 2 % pour qu'une petite valeur reste visible). */
  hauteur(m: MoisStatistiqueDTO): number {
    const v = this.valeur(m);
    return v > 0 ? Math.max(2, Math.round((v / this.maximum()) * 100)) : 0;
  }

  /** « 2026-10 » → Date du 1er du mois, pour le pipe date (« oct. », « octobre 2026 »). */
  dateDuMois(m: MoisStatistiqueDTO): Date {
    const [annee, mois] = m.mois.split('-').map(Number);
    return new Date(annee, mois - 1, 1);
  }
}
