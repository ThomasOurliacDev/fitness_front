import { InjectionToken } from '@angular/core';
import { AppEnvironment } from '../../../environments/environment.model';
import { environment } from '../../../environments/environment';

/**
 * Token DI pour l'environnement. À utiliser dans les services :
 *   private readonly env = inject(ENVIRONMENT);
 *
 * Permet de remplacer l'environnement en test (TestBed.overrideProvider).
 */
export const ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT', {
  providedIn: 'root',
  factory: () => environment
});
