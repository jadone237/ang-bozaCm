import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OffreService } from '../../../offres/data-access/offre.service';
import { OffreResponseDTO } from '../../../offres/models/offre.model';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css',
})
export class AccueilComponent implements OnInit {
  activeTransport = signal<'BUS' | 'AVION' | 'TRAIN'>('BUS');
  offres: OffreResponseDTO[] = [];
  isLoadingOffres = true;
  offresError = '';

  searchForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private offreService: OffreService
  ) {
    this.searchForm = this.fb.group({
      depart: ['Douala'],
      destination: ['Douala'],
      date: [''],
    });
  }

  ngOnInit(): void {
    this.offreService.getAllOffres().subscribe({
      next: (offres) => {
        this.offres = offres;
        this.isLoadingOffres = false;
      },
      error: (error) => {
        this.offresError = error.message;
        this.isLoadingOffres = false;
      }
    });
  }

  setTransport(type: 'BUS' | 'AVION' | 'TRAIN') {
    this.activeTransport.set(type);
  }

  search() {
    console.log('Recherche', this.activeTransport(), this.searchForm.value);
  }

}