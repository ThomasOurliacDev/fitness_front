import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

/** Bloque l'accès aux routes privées si l'utilisateur n'est pas connecté. */
export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

/**
 * Empêche d'accéder au layout public (login) si on est déjà connecté.
 * On renvoie `false` (et PAS un UrlTree) : la route `path: ''` du layout auth
 * matche toutes les URLs en préfixe, donc rediriger ici relancerait ce même
 * guard à l'infini. `false` laisse simplement le routeur essayer le layout
 * privé suivant, qui gère `/entrainement` et le fallback.
 */
export const guestGuard: CanMatchFn = (): boolean => {
  const auth = inject(AuthService);
  return !auth.isAuthenticated();
};
