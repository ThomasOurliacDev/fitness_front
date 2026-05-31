import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule],
  template: `
    <h1>Dashboard</h1>
    <div class="grid">
      <p-card header="Sessions"     subheader="Aujourd'hui">   <p class="kpi">1 248</p></p-card>
      <p-card header="Erreurs"      subheader="Dernière heure"><p class="kpi">3</p></p-card>
      <p-card header="Utilisateurs" subheader="Actifs">        <p class="kpi">87</p></p-card>
      <p-card header="Latence p95"  subheader="API">           <p class="kpi">142 ms</p></p-card>
    </div>
  `,
  styles: [`
    h1 { margin: 0 0 1rem; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .kpi { font-size: 2rem; font-weight: 700; color: var(--app-color-primary); margin: 0; }
  `]
})
export default class ProgramComponent {}
