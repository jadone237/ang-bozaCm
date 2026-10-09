import { Injectable, signal } from '@angular/core';

export type TypeNotification = 'succes' | 'erreur' | 'info';

export interface Notification {
  id: number;
  type: TypeNotification;
  message: string;
}

export interface DemandeConfirmation {
  titre: string;
  message: string;
  libelleConfirmer: string;
  /** Bouton rouge pour les actions destructrices (suppression, annulation). */
  danger: boolean;
  repondre: (reponse: boolean) => void;
}

/**
 * Notifications « toast » (en bas à droite, disparaissent seules) et fenêtre de confirmation
 * au style BozaCM, à la place de alert() / confirm() du navigateur.
 * Affichées par <app-notifications> placé une seule fois dans AppComponent.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private compteur = 0;

  notifications = signal<Notification[]>([]);
  confirmation = signal<DemandeConfirmation | null>(null);

  succes(message: string): void {
    this.afficher('succes', message);
  }

  erreur(message: string): void {
    // Une erreur reste un peu plus longtemps pour laisser le temps de la lire
    this.afficher('erreur', message, 6000);
  }

  info(message: string): void {
    this.afficher('info', message);
  }

  fermer(id: number): void {
    this.notifications.update((liste) => liste.filter((n) => n.id !== id));
  }

  /**
   * Ouvre la fenêtre de confirmation et résout true (Confirmer) ou false (Annuler, Échap, clic à côté).
   * Usage : if (!(await this.notifications.confirmer({ ... }))) return;
   */
  confirmer(options: { titre?: string; message: string; libelleConfirmer?: string; danger?: boolean }): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmation.set({
        titre: options.titre ?? 'Confirmation',
        message: options.message,
        libelleConfirmer: options.libelleConfirmer ?? 'Confirmer',
        danger: options.danger ?? true,
        repondre: (reponse) => {
          this.confirmation.set(null);
          resolve(reponse);
        },
      });
    });
  }

  private afficher(type: TypeNotification, message: string, duree = 4000): void {
    const id = ++this.compteur;
    this.notifications.update((liste) => [...liste, { id, type, message }]);
    setTimeout(() => this.fermer(id), duree);
  }
}
