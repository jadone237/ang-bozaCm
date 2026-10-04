import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'bozacm-theme';

  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const current = this.theme();
      if (typeof document === 'undefined') return;

      document.documentElement.setAttribute('data-theme', current);
      document.documentElement.setAttribute('data-bs-theme', current);
      try {
        localStorage.setItem(this.storageKey, current);
      } catch {
        // localStorage bloqué (navigation privée) : on continue sans persister
      }
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  private getInitialTheme(): Theme {
    if (typeof localStorage === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'light';
  }
}
