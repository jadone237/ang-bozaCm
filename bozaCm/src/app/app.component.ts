import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'bozaCm';

  // Instancié dès le démarrage pour que le thème sauvegardé s'applique sur toutes les pages.
  private theme = inject(ThemeService);
}
