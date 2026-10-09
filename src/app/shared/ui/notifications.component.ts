import { Component, ElementRef, HostListener, effect, inject, viewChild } from '@angular/core';
import { NotificationService } from './notification.service';

/** Zone des toasts et fenêtre de confirmation, placée une seule fois dans AppComponent. */
@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <div class="zone-toasts" aria-live="polite">
      @for (n of service.notifications(); track n.id) {
        <div class="toast-boza" [class]="'toast-boza toast-' + n.type" role="status">
          <i class="bi" [class.bi-check-circle-fill]="n.type === 'succes'"
             [class.bi-exclamation-octagon-fill]="n.type === 'erreur'"
             [class.bi-info-circle-fill]="n.type === 'info'"></i>
          <span>{{ n.message }}</span>
          <button type="button" class="fermer-toast" (click)="service.fermer(n.id)" aria-label="Fermer">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      }
    </div>

    @if (service.confirmation(); as c) {
      <div class="fond-confirmation" (click)="c.repondre(false)">
        <div class="fenetre-confirmation" role="alertdialog" aria-modal="true"
             aria-labelledby="titre-confirmation" (click)="$event.stopPropagation()">
          <div class="icone-confirmation" [class.danger]="c.danger">
            <i class="bi" [class.bi-exclamation-triangle]="c.danger" [class.bi-question-circle]="!c.danger"></i>
          </div>
          <h2 id="titre-confirmation">{{ c.titre }}</h2>
          <p>{{ c.message }}</p>
          <div class="actions-confirmation">
            <button type="button" class="bouton-annuler" (click)="c.repondre(false)">Annuler</button>
            <button #boutonConfirmer type="button" class="bouton-confirmer" [class.danger]="c.danger"
                    (click)="c.repondre(true)">{{ c.libelleConfirmer }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent {
  service = inject(NotificationService);
  private boutonConfirmer = viewChild<ElementRef<HTMLButtonElement>>('boutonConfirmer');

  constructor() {
    // Le focus va sur le bouton principal à l'ouverture (Entrée confirme, Échap annule)
    effect(() => this.boutonConfirmer()?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  echap(): void {
    this.service.confirmation()?.repondre(false);
  }
}
