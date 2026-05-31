import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';
import { ENVIRONMENT } from '../../../core/config/environment.token';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, MenuModule],
  template: `
    <header class="navbar">
      <button
        type="button"
        class="navbar__burger"
        aria-label="Toggle sidebar"
        (click)="toggleSidebar.emit()"
      >
        <i class="pi pi-bars"></i>
      </button>

      <div class="navbar__title">Airbus POC</div>

      @if (env.name !== 'PROD') {
        <span class="navbar__env" [attr.data-env]="env.name">{{ env.name }}</span>
      }

      <div class="navbar__spacer"></div>

      <button
        type="button"
        class="navbar__user"
        (click)="userMenu.toggle($event)"
        [attr.aria-label]="'User menu for ' + (auth.user()?.name ?? 'guest')"
      >
        <i class="pi pi-user"></i>
        <span>{{ auth.user()?.name }}</span>
        <i class="pi pi-chevron-down"></i>
      </button>
      <p-menu #userMenu [model]="userMenuItems" [popup]="true" appendTo="body" />
    </header>
  `,
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly env = inject(ENVIRONMENT);
  private readonly router = inject(Router);

  readonly toggleSidebar = output<void>();

  readonly userMenuItems: MenuItem[] = [
    { label: 'Settings', icon: 'pi pi-cog',     command: () => this.router.navigate(['/settings']) },
    { separator: true },
    { label: 'Logout',   icon: 'pi pi-sign-out', command: () => this.logout() }
  ];

  private logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
