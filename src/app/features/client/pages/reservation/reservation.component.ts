import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OffreService, Offre } from '../../../../core/services/offre.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { environment } from '../../../../../environments/environment';
import { ClientNavbarComponent } from '../../../../shared/client-navbar/client-navbar.component';

type TransportType = 'BUS' | 'TRAIN' | 'AVION';

// Images dans bozaCm/public/. Seule bus.jpg existe pour l'instant : si train.jpg / avion.jpg
// sont absents, l'image est masquée (événement error) et le dégradé + icône prend le relais.
const HERO_IMAGES: Record<TransportType, string> = {
  BUS: '/bus.jpg',
  TRAIN: '/train.jpg',
  AVION: '/avion.jpg',
};
const HERO_LABELS: Record<TransportType, string> = {
  BUS: 'BUS VIP CLIMATISÉ',
  TRAIN: 'TRAIN',
  AVION: 'VOL DIRECT',
};

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ClientNavbarComponent],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.css'
})
export class ReservationComponent implements OnInit {
  // ---- État de la page (signals) ----
  offre = signal<Offre | null>(null);
  isLoadingOffre = signal(true);
  loadError = signal('');

  transportType = signal<TransportType>('BUS');
  heroImage = computed(() => HERO_IMAGES[this.transportType()]);
  heroLabel = computed(() => HERO_LABELS[this.transportType()]);
  heroIcon = computed(() => {
    switch (this.transportType()) {
      case 'AVION': return 'bi-airplane';
      case 'TRAIN': return 'bi-train-front';
      default: return 'bi-bus-front';
    }
  });
  heroImageFailed = signal(false);
  nombrePassagers = signal(1); // fixé à 1 pour l'instant, comme sur la maquette ("1 Adulte")

  isSubmitting = signal(false);
  submitError = signal('');
  submitSuccess = signal(false);

  // ⚠️ Chemin de téléchargement du billet deviné (endpoint jamais confirmé côté backend
  // dans cette session — cohérent avec ce qui a été évoqué : /v1/billets/{id}/pdf).
  // null tant qu'on n'a pas un id de réservation réel renvoyé par le POST de création.
  billetUrl = signal<string | null>(null);

  // Le montant total recalculé automatiquement si le prix ou le nb de passagers change
  montantTotal = computed(() => {
    const o = this.offre();
    return o ? o.prix * this.nombrePassagers() : 0;
  });

  form: FormGroup;
  /** Un visiteur peut consulter l'offre ; la connexion n'est demandée qu'au moment de réserver. */
  readonly estConnecte: boolean;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private offreService: OffreService,
    private authService: AuthService
  ) {
    this.estConnecte = this.authService.isAuthenticated();
    this.form = this.fb.group({
      nomComplet: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      // format numéro camerounais : 9 chiffres commençant par 6 (MTN/Orange)
      telephone: ['', [Validators.required, Validators.pattern(/^6\d{8}$/)]]
    });
  }

  ngOnInit(): void {
    const offreId = Number(this.route.snapshot.paramMap.get('offreId'));
    const typeParam = (this.route.snapshot.paramMap.get('type') || 'bus').toUpperCase();
    this.transportType.set(typeParam === 'AVION' ? 'AVION' : typeParam === 'TRAIN' ? 'TRAIN' : 'BUS');

    if (!offreId) {
      this.loadError.set('Offre introuvable.');
      this.isLoadingOffre.set(false);
      return;
    }

    // Pré-remplissage : on ne fait pas taper au client des infos qu'on connaît déjà de lui.
    // NB : LoginResponse (AuthService) ne porte que { token, role, email } pour l'instant,
    // donc seul l'email peut être pré-rempli ; nomComplet reste vide tant que le backend
    // ne renvoie pas le nom dans la session.
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.form.patchValue({
        email: currentUser.email ?? ''
      });
    }

    this.offreService.getAll().subscribe({
      next: (offres) => {
        const found = offres.find(o => o.id === offreId) ?? null;
        this.offre.set(found);
        if (!found) {
          this.loadError.set("Cette offre n'existe plus ou n'est plus disponible.");
        }
        this.isLoadingOffre.set(false);
      },
      error: () => {
        this.loadError.set('Impossible de charger les détails du voyage.');
        this.isLoadingOffre.set(false);
      }
    });
  }

  

  submit(): void {
    if (!this.estConnecte) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const o = this.offre();
    if (!o) return;

    this.isSubmitting.set(true);
    this.submitError.set('');

    // ⚠️ À VÉRIFIER avec ReservationBusController / ReservationAvionController :
    // si le backend déduit le client courant depuis le token JWT (SecurityContext),
    // ce payload suffit. S'il exige un clientId explicite dans le DTO, ajoute-le
    // (ex: clientId: this.authService.currentUser()?.id).
    const payload = {
      offreId: o.id,
      nomPassager: this.form.value.nomComplet,
      emailPassager: this.form.value.email,
      telephonePassager: this.form.value.telephone,
      nombrePlaces: this.nombrePassagers(),
      prixReservation: this.montantTotal(),
    };

    const endpoint = `${environment.apiUrl}/v1/reservations/${this.transportType().toLowerCase()}/create`;

    this.http.post<any>(endpoint, payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);

        // Défensif : nom exact du champ id non confirmé dans la réponse de création
        // de réservation (ReservationBusController/AvionController non vus ici).
        const reservationId = res?.id ?? res?.idReservation ?? res?.data?.id ?? res?.data?.idReservation ?? res?.reservation?.id ?? null;
        if (reservationId) {
          this.chercherBillet(reservationId);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.submitError.set(
          err?.error?.message || 'La réservation a échoué. Vérifie les informations et réessaie.'
        );
      }
    });
  }

  // Endpoints confirmés côté backend (BilletController.java) :
  //   GET /api/v1/billets/reservation/{reservationId} → BilletResponseDTO (avec numeroBillet)
  //   GET /api/v1/billets/pdf/{numeroBillet}          → le PDF lui-même
  // Si aucun billet n'existe encore pour cette réservation (pas encore créé côté
  // backend, ou pas auto-généré), l'appel échoue silencieusement — pas de lien
  // de téléchargement affiché plutôt qu'un lien cassé.
  private chercherBillet(reservationId: number): void {
    this.http.get<any>(`${environment.apiUrl}/v1/billets/reservation/${reservationId}`).subscribe({
      next: (res) => {
        const numeroBillet = res?.numeroBillet ?? res?.data?.numeroBillet ?? null;
        if (numeroBillet) {
          this.billetUrl.set(`${environment.apiUrl}/v1/billets/pdf/${numeroBillet}`);
        }
      },
      error: () => {
        // Pas de billet trouvé pour cette réservation — normal si la création du
        // billet n'est pas (encore) déclenchée automatiquement côté backend.
      },
    });
  }

  retourAccueil(): void {
    this.router.navigate(['/accueil']);
  }
}
