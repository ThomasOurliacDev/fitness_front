import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Toaster — wrapper haut-niveau autour du `MessageService` de PrimeNG.
 *
 * Pourquoi un wrapper plutôt que d'injecter `MessageService` partout ?
 *  - API métier (`success`, `error`, …) au lieu de manipuler des objets bruts.
 *  - Valeurs par défaut homogènes (durée, sticky pour les erreurs, key).
 *  - Point unique pour brancher la télémétrie, la traduction, etc.
 *
 * USAGE :
 *   private toaster = inject(ToasterService);
 *   this.toaster.success('Connecté', 'Bienvenue !');
 *   this.toaster.error('Login KO', 'Identifiants invalides');
 */
export interface ToastOptions {
  /** Durée d'affichage en ms. Ignoré si `sticky` est vrai. */
  life?: number;
  /** Reste tant que l'utilisateur ne ferme pas. */
  sticky?: boolean;
  /** Cible un `<p-toast key="...">` particulier. Par défaut: toast global. */
  key?: string;
}

type Severity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';

@Injectable({ providedIn: 'root' })
export class ToasterService {
  private readonly messages = inject(MessageService);

  /** Durées par défaut — alignées avec les usages classiques d'UX. */
  private readonly DEFAULT_LIFE: Record<Severity, number> = {
    success: 3000,
    info:    4000,
    warn:    5000,
    error:   6000,
    secondary: 3000,
    contrast:  3000
  };

  success(summary: string, detail?: string, opts?: ToastOptions): void {
    this.show('success', summary, detail, opts);
  }

  info(summary: string, detail?: string, opts?: ToastOptions): void {
    this.show('info', summary, detail, opts);
  }

  warn(summary: string, detail?: string, opts?: ToastOptions): void {
    this.show('warn', summary, detail, opts);
  }

  /** Les erreurs sont sticky par défaut — on ne veut pas qu'elles disparaissent. */
  error(summary: string, detail?: string, opts?: ToastOptions): void {
    this.show('error', summary, detail, { sticky: true, ...opts });
  }

  /** Efface tous les toasts (ou ceux d'une `key` donnée). */
  clear(key?: string): void {
    this.messages.clear(key);
  }

  // --- interne ---------------------------------------------------------------
  private show(severity: Severity, summary: string, detail?: string, opts: ToastOptions = {}): void {
    this.messages.add({
      severity,
      summary,
      detail,
      key: opts.key,
      sticky: opts.sticky,
      life: opts.sticky ? undefined : (opts.life ?? this.DEFAULT_LIFE[severity])
    });
  }
}
