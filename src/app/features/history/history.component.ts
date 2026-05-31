import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TableModule } from 'primeng/table';

interface Row { date: string; action: string; user: string; status: string; }

@Component({
  selector: 'app-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableModule],
  template: `
    <h1>Historique</h1>
    <p-table [value]="rows" [paginator]="true" [rows]="5">
      <ng-template pTemplate="header">
        <tr>
          <th>Date</th><th>Action</th><th>Utilisateur</th><th>Statut</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-r>
        <tr>
          <td>{{ r.date }}</td><td>{{ r.action }}</td><td>{{ r.user }}</td><td>{{ r.status }}</td>
        </tr>
      </ng-template>
    </p-table>
  `,
  styles: [`h1 { margin: 0 0 1rem; }`]
})
export default class HistoryComponent {
  rows: Row[] = [
    { date: '2026-05-30 09:12', action: 'Login',  user: 'alice', status: 'OK' },
    { date: '2026-05-30 09:15', action: 'Export', user: 'alice', status: 'OK' },
    { date: '2026-05-30 09:21', action: 'Update', user: 'bob',   status: 'OK' },
    { date: '2026-05-30 09:34', action: 'Delete', user: 'bob',   status: 'FAIL' },
    { date: '2026-05-30 09:42', action: 'Login',  user: 'carol', status: 'OK' },
    { date: '2026-05-30 09:51', action: 'Create', user: 'alice', status: 'OK' }
  ];
}
