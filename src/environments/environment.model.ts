export type EnvName = 'LOCAL' | 'DEV' | 'INT' | 'PROD';

export interface AppEnvironment {
  /** Nom de l'environnement, affiché dans la navbar (sauf PROD). */
  name: EnvName;
  /** Active les optimisations Angular et masque le badge env. */
  production: boolean;
  /** URL de base de l'API. */
  apiUrl: string;
  /** Active les logs verbeux (console.debug). */
  enableDebugLogs: boolean;
}
