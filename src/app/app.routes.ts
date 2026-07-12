import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // ---- Routes publiques (auth) ----
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    canMatch: [guestGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      }
    ]
  },

  // ---- Routes privées (layout principal) ----
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canMatch: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'entrainement' },
      { path: 'entrainement', loadComponent: () => import('./features/entrainement/entrainement.component') },
      {
        path: 'entrainement/program/:id',
        loadComponent: () =>
          import('./features/entrainement/program-detail/program-detail.component').then(m => m.ProgramDetailComponent)
      },
      {
        path: 'entrainement/session',
        loadComponent: () =>
          import('./features/entrainement/session/session.component').then(m => m.SessionComponent)
      },
      { path: 'activity',  loadComponent: () => import('./features/activity/activity.component')  },
      { path: 'history',   loadComponent: () => import('./features/history/history.component')   },
      { path: 'settings',  loadComponent: () => import('./features/settings/settings.component')  }
    ]
  },

  // ---- Fallback ----
  { path: '**', redirectTo: '' }
];
