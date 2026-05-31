import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

/**
 * Échelle des breakpoints — DOIT rester alignée avec
 * `src/styles/_breakpoints.scss`. La valeur est lue depuis les CSS vars
 * (`--bp-md`, etc.) pour garantir une source unique.
 */
export type BreakpointName = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const ORDER: BreakpointName[] = ['sm', 'md', 'lg', 'xl', '2xl'];

@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private readonly doc = inject(DOCUMENT);
  private readonly win: Window | null = this.doc.defaultView;

  /** Largeur fenêtre (réactive). */
  readonly width = signal(this.win?.innerWidth ?? 0);

  /** Breakpoint courant (le plus haut atteint). */
  readonly current = computed<BreakpointName | 'xs'>(() => {
    const w = this.width();
    let res: BreakpointName | 'xs' = 'xs';
    for (const bp of ORDER) {
      if (w >= this.px(bp)) res = bp;
    }
    return res;
  });

  /** Helpers `>= bp`. */
  readonly isMd = computed(() => this.width() >= this.px('md'));
  readonly isLg = computed(() => this.width() >= this.px('lg'));
  readonly isXl = computed(() => this.width() >= this.px('xl'));

  /** Vrai si on est en "mobile" (< md). À utiliser pour activer un drawer, etc. */
  readonly isMobile = computed(() => !this.isMd());

  constructor() {
    this.win?.addEventListener('resize', () => this.width.set(this.win!.innerWidth), { passive: true });
  }

  /** API impérative pour requête custom : `bp.matches('(min-width: 900px)')`. */
  matches(query: string): boolean {
    return this.win?.matchMedia(query).matches ?? false;
  }

  /** Lit la CSS var `--bp-<name>` en pixels. Source unique avec le SCSS. */
  private px(bp: BreakpointName): number {
    const raw = getComputedStyle(this.doc.documentElement).getPropertyValue(`--bp-${bp}`).trim();
    return parseFloat(raw) || 0;
  }
}
