import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { BreakpointService } from '../../core/responsive/breakpoint.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="layout" [class.collapsed]="collapsed()" (click)="onScrimClick($event)">
      <app-sidebar [collapsed]="collapsed()" />
      <div class="layout__main">
        <app-navbar (toggleSidebar)="collapsed.set(!collapsed())" />
        <main class="layout__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly bp = inject(BreakpointService);
  private readonly router = inject(Router);

  // Sur mobile : la sidebar est repliée (= fermée) par défaut.
  // Sur desktop : elle est ouverte par défaut.
  readonly collapsed = signal(this.bp.isMobile());

  constructor() {
    // Re-synchronise sur resize : si on bascule mobile→desktop, on ouvre ; l'inverse, on ferme.
    effect(() => { this.collapsed.set(this.bp.isMobile()); });

    // Sur mobile, on referme la sidebar à chaque navigation (UX standard drawer).
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => { if (this.bp.isMobile()) this.collapsed.set(true); });
  }

  /** Ferme le drawer si on clique sur le scrim (mobile uniquement). */
  onScrimClick(ev: MouseEvent): void {
    if (!this.bp.isMobile() || this.collapsed()) return;
    const target = ev.target as HTMLElement;
    // Le clic dans la sidebar ou la navbar ne ferme pas le drawer.
    if (target.closest('app-sidebar, app-navbar')) return;
    this.collapsed.set(true);
  }
}
