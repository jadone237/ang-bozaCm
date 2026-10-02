import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Offre {
  icon: string;
  badge: string;
  badgeClass: string;
  accentClass: string;
  titre: string;
  duree: string;
  compagnie: string;
  prix: string;
  boutonClass: string;
}

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css',
})
export class AccueilComponent {
  activeTransport = signal<'BUS' | 'AVION' | 'TRAIN'>('BUS');

  searchForm: FormGroup;

  offres: Offre[] = [
    { icon: 'bi-bus-front', badge: 'VIP CLASS', badgeClass: 'badge-grey', accentClass: 'accent-navy',
      titre: 'VIP Yaoundé → Douala', duree: '3h30', compagnie: 'Opep plus confort', prix: '15 000 FCFA', boutonClass: 'btn-navy' },
    { icon: 'bi-airplane', badge: 'DIRECT', badgeClass: 'badge-amber', accentClass: 'accent-teal',
      titre: 'Vol Douala → Garoua', duree: '1h30', compagnie: 'Camair-Co', prix: '45 000 FCFA', boutonClass: 'btn-teal' },
    { icon: 'bi-train-front', badge: 'EXPRESS', badgeClass: 'badge-green', accentClass: 'accent-green',
      titre: 'Express Baf → Bamenda', duree: '2h30', compagnie: 'Bamenda Express', prix: '3 500 FCFA', boutonClass: 'btn-green' },
  ];

  constructor(private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      depart: ['Douala'],
      destination: ['Douala'],
      date: [''],
    });
  }

  setTransport(type: 'BUS' | 'AVION' | 'TRAIN') {
    this.activeTransport.set(type);
  }

  search() {
    console.log('Recherche', this.activeTransport(), this.searchForm.value);
  }
}