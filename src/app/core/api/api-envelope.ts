/**
 * Enveloppe standard renvoyée par TOUTES les routes du backend.
 *
 * ✅ Succès : { success: true,  data: {...},  error: null }
 * ❌ Erreur : { success: false, data: null,   error: { statusCode, message } }
 *
 * Note : en cas d'erreur HTTP, Angular lève une HttpErrorResponse dont
 * `err.error` contient cette enveloppe → le message serveur est dans
 * `err.error?.error?.message` (string, ou string[] pour les erreurs de validation).
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: ApiError | null;
}
