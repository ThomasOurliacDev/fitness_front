import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_ITEMS_LOWER, NAV_ITEMS_UPPER } from '../../../core/navigation/nav-items';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar__brand">
        <i class="pi pi-send"></i>
        @if (!collapsed()) { <span>Fitness__App</span> }
      </div>

      <nav class="sidebar__nav" aria-label="Primary">
        <div>
        @for (item of itemsUpper; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="is-active"
            class="sidebar__item"
            [attr.title]="collapsed() ? item.label : null"
          >
            <i [class]="item.icon"></i>
            @if (!collapsed()) { <span>{{ item.label }}</span> }
          </a>
        }
        </div>
        <div>
        @for (item of itemsLower; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="is-active"
            class="sidebar__item"
            [attr.title]="collapsed() ? item.label : null"
          >
            <i [class]="item.icon"></i>
            @if (!collapsed()) { <span>{{ item.label }}</span> }
          </a>
        }
        </div>
      </nav>
    </aside>
  `,
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly collapsed = input(false);
  protected readonly itemsUpper = NAV_ITEMS_UPPER;
  protected readonly itemsLower = NAV_ITEMS_LOWER;
}
