import { DOCUMENT, Injectable, inject, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'app.theme';
const DARK_CLASS = 'app-dark'; // doit matcher `darkModeSelector` de providePrimeNG

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly media =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  /** Préférence utilisateur (light / dark / system). */
  readonly mode = signal<ThemeMode>(this.readStored());

  /** Thème effectivement appliqué (résout 'system'). */
  readonly resolved = signal<'light' | 'dark'>(this.computeResolved(this.mode()));

  constructor() {
    // Applique la classe et persiste à chaque changement de mode.
    effect(() => {
      const m = this.mode();
      const r = this.computeResolved(m);
      this.resolved.set(r);
      this.applyClass(r);
      try { localStorage.setItem(STORAGE_KEY, m); } catch { /* SSR / privé */ }
    });

    // Réagit au changement de préférence système quand mode = 'system'.
    this.media?.addEventListener('change', () => {
      if (this.mode() === 'system') {
        const r = this.computeResolved('system');
        this.resolved.set(r);
        this.applyClass(r);
      }
    });
  }

  set(mode: ThemeMode): void { this.mode.set(mode); }

  toggle(): void {
    this.mode.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private computeResolved(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'system') return this.media?.matches ? 'dark' : 'light';
    return mode;
  }

  private applyClass(resolved: 'light' | 'dark'): void {
    this.doc.documentElement.classList.toggle(DARK_CLASS, resolved === 'dark');
  }

  private readStored(): ThemeMode {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (v === 'light' || v === 'dark' || v === 'system') return v;
    } catch { /* ignore */ }
    return 'system';
  }
}
