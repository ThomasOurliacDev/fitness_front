import { AppEnvironment } from './environment.model';

// Environnement par défaut = LOCAL (utilisé par `ng serve` sans configuration).
export const environment: AppEnvironment = {
  name: 'LOCAL',
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  enableDebugLogs: true
};
