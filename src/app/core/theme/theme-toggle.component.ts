import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { ThemeService, ThemeMode } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonModule, SelectButtonModule],
  template: `
    <p-selectbutton
      [options]="options"
      [ngModel]="mode()"
      (ngModelChange)="onChange($event)"
      optionLabel="label"
      optionValue="value"
      [allowEmpty]="false"
      aria-label="Theme"
    />
  `
})
export class ThemeToggleComponent {
  private readonly theme = inject(ThemeService);
  readonly mode = computed(() => this.theme.mode());

  readonly options: { label: string; value: ThemeMode }[] = [
    { label: 'Light',  value: 'light'  },
    { label: 'Dark',   value: 'dark'   },
    { label: 'System', value: 'system' }
  ];

  onChange(value: ThemeMode): void { this.theme.set(value); }
}
