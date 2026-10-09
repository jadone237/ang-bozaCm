import { Component, input } from '@angular/core';

/** Lignes grises animées affichées pendant le chargement, à la place de « Chargement… ». */
@Component({
  selector: 'app-squelette',
  standalone: true,
  template: `
    <div class="squelette" aria-busy="true" aria-label="Chargement en cours">
      @for (ligne of lignesAffichees(); track $index) {
        <div class="ligne-squelette">
          <span class="bloc large"></span><span class="bloc"></span><span class="bloc"></span><span class="bloc court"></span>
        </div>
      }
    </div>
  `,
  styles: [`
    .squelette { padding: 6px 22px; }
    .ligne-squelette { display: grid; grid-template-columns: 2fr 1fr 1fr .6fr; gap: 16px; padding: 16px 0; border-top: 1px solid var(--border, #f0f2f5); }
    .ligne-squelette:first-child { border-top: 0; }
    .bloc { height: 14px; border-radius: 7px; background: linear-gradient(90deg, #eef1f5 25%, #f7f9fb 37%, #eef1f5 63%); background-size: 400% 100%; animation: brille 1.3s ease infinite; }
    .bloc.large { height: 16px; }
    .bloc.court { width: 60%; }
    :host-context([data-theme="dark"]) .bloc { background: linear-gradient(90deg, #1c2a4a 25%, #24355a 37%, #1c2a4a 63%); background-size: 400% 100%; }
    @keyframes brille { from { background-position: 100% 50%; } to { background-position: 0 50%; } }
    @media (prefers-reduced-motion: reduce) { .bloc { animation: none; } }
  `],
})
export class SqueletteComponent {
  lignes = input(5);
  lignesAffichees = () => Array.from({ length: this.lignes() });
}
