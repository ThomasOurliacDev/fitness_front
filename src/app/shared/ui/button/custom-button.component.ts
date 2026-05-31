import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Exemple de composant custom utilisant les MÊMES tokens que PrimeNG
 * via les CSS vars (--app-color-primary, etc.) → cohérence visuelle garantie.
 */
@Component({
  selector: 'app-custom-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="custom-btn" [attr.data-variant]="variant()">
      <ng-content />
    </button>
  `,
  styleUrl: './custom-button.component.scss'
})
export class CustomButtonComponent {
  variant = input<'primary' | 'outline'>('primary');
}
