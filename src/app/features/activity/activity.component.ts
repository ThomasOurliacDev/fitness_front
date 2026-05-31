import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-activity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule],
  template: `
    <h1>Activity</h1>
    <p-card>
      <p>Flux d'activité temps réel à venir.</p>
    </p-card>
  `,
  styles: [`h1 { margin: 0 0 1rem; }`]
})
export default class ActivityComponent {}
