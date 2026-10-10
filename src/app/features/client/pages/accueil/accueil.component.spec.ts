import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccueilComponent } from './accueil.component';
import { Offre } from '../../../../core/services/offre.service';

describe('AccueilComponent', () => {
  let component: AccueilComponent;
  let fixture: ComponentFixture<AccueilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccueilComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccueilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps expired offers visible after currently available offers', () => {
    const expired = creerOffre(1, 'expired', dateRelative(component.dateMin, -1));
    const available = creerOffre(2, 'available', dateRelative(component.dateMin, 1));
    component.offres.set([expired, available]);

    expect(component.offresAffichees()).toEqual([available, expired]);
    expect(component.badgePlaces(expired)).toBe('Offre expirée');
    expect(component.badgeClassPlaces(expired, 0)).toBe('badge-expired');
  });

  it('does not mark an offer departing today as expired', () => {
    const departingToday = creerOffre(3, 'today', component.dateMin);

    expect(component.estPassee(departingToday)).toBeFalse();
    expect(component.badgePlaces(departingToday)).toBe('30 places');
  });
});

function creerOffre(id: number, titre: string, dateDepart: string): Offre {
  return {
    id,
    titre,
    description: '',
    prix: 1000,
    dateDepart,
    nombrePlaces: 30,
    placesDisponibles: 30,
    agence: { id: 1, nom: 'Agence test' },
    trajet: { id: 1, villeDepart: 'Yaoundé', villeArrivee: 'Douala' }
  };
}

function dateRelative(date: string, delta: number): string {
  const [annee, mois, jour] = date.split('-').map(Number);
  const resultat = new Date(annee, mois - 1, jour + delta);
  return `${resultat.getFullYear()}-${String(resultat.getMonth() + 1).padStart(2, '0')}-${String(resultat.getDate()).padStart(2, '0')}`;
}
