import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export type Theme = 'light' | 'dark';

/** L'espace client et l'espace admin ont chacun leur propre mode clair / sombre. */
type Espace = 'client' | 'admin';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly router = inject(Router);

  private readonly cles: Record<Espace, string> = {
    client: 'bozacm-theme-client',
    admin: 'bozacm-theme-admin',
  };

  private readonly themes: Record<Espace, ReturnType<typeof signal<Theme>>> = {
    client: signal<Theme>(this.getInitialTheme('client')),
    admin: signal<Theme>(this.getInitialTheme('admin')),
  };

  /** Espace affiché : déterminé par l'adresse (/admin/... = admin, tout le reste = client). */
  private espace = signal<Espace>(
    this.espaceDe(typeof window !== 'undefined' ? window.location.pathname : '/')
  );

  /** Thème de l'espace affiché (utilisé par les boutons lune / soleil). */
  theme = computed(() => this.themes[this.espace()]());

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.espace.set(this.espaceDe(e.urlAfterRedirects)));

    effect(() => {
      const current = this.theme();
      if (typeof document === 'undefined') return;

      document.documentElement.setAttribute('data-theme', current);
      document.documentElement.setAttribute('data-bs-theme', current);
    });

    // Chaque espace mémorise son propre choix
    (Object.keys(this.themes) as Espace[]).forEach((espace) => {
      effect(() => {
        const valeur = this.themes[espace]();
        try {
          localStorage.setItem(this.cles[espace], valeur);
        } catch {
          // localStorage bloqué (navigation privée) : on continue sans persister
        }
      });
    });
  }

  /** Change le mode de l'espace affiché uniquement (client ou admin). */
  toggle(): void {
    this.themes[this.espace()].update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  private espaceDe(url: string): Espace {
    return url.startsWith('/admin') ? 'admin' : 'client';
  }

  private getInitialTheme(espace: Espace): Theme {
    if (typeof localStorage === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem(this.cles[espace])
        // Ancienne clé commune : reprise pour l'espace client, qui avait déjà ce réglage
        ?? (espace === 'client' ? localStorage.getItem('bozacm-theme') : null);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'light';
  }
}
