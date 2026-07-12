import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ENVIRONMENT } from '../config/environment.token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const env = inject(ENVIRONMENT);

  const token = authService.token();

  // Le Bearer n'est attaché qu'aux appels vers NOTRE API — jamais vers un service tiers.
  const isApiRequest = req.url.startsWith(env.apiUrl);

  const authReq = token && isApiRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      // Token expiré ou invalide → on déconnecte et on renvoie au login.
      // Exception : les routes /auth/ (un 401 au login = identifiants incorrects,
      // c'est au composant de l'afficher, pas à nous de rediriger).
      const isAuthRoute = req.url.includes('/auth/');

      if (err instanceof HttpErrorResponse && err.status === 401 && isApiRequest && !isAuthRoute) {
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => err);
    })
  );
};
