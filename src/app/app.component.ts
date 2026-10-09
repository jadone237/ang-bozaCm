import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { NotificationsComponent } from './shared/ui/notifications.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'bozaCm';

  // Instancié dès le démarrage pour que le thème sauvegardé s'applique sur toutes les pages.
  private theme = inject(ThemeService);
}
