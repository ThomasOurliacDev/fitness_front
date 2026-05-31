import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ThemeToggleComponent } from '../../core/theme/theme-toggle.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, ThemeToggleComponent],
  template: `
    <h1>Settings</h1>

    <p-card header="Apparence">
      <p>Choisissez le thème de l'application.</p>
      <app-theme-toggle />
    </p-card>

    <p-card header="Compte" styleClass="mt-3">
      <p><strong>Utilisateur :</strong> {{ auth.user()?.name }}</p>
      <p><strong>Email :</strong> {{ auth.user()?.email }}</p>
    </p-card>
  `,
  styles: [`
    h1 { margin: 0 0 1rem; }
    p-card + p-card { display: block; margin-top: 1rem; }
  `]
})
export default class SettingsComponent {
  protected readonly auth = inject(AuthService);
}
