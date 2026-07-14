import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { ThemeService } from '../../../core/theme/theme.service';

/** Une série (un exercice) à tracer sur le graphique. */
export interface ChartSeries {
  label: string;
  /** Aligné sur les labels de l'axe X ; `null` là où l'exercice n'a pas de donnée ce jour-là. */
  data: (number | null)[];
}

// Palette fixe et distincte par index de série — stable même si l'ordre de sélection change,
// puisqu'on l'indexe par position dans le tableau `series` plutôt que par une couleur "au hasard".
const SERIES_COLORS = [
  '#2563eb', // bleu
  '#dc2626', // rouge
  '#16a34a', // vert
  '#d97706', // orange
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#db2777', // rose
  '#65a30d', // olive
];

/**
 * Graphique en ligne générique pour comparer plusieurs séries temporelles (ex: le poids max
 * de plusieurs exercices au fil des séances). Wrapper fin autour de p-chart/Chart.js — voir
 * PerformanceChartComponent#chartOptions pour la lecture des tokens de thème (clair/sombre).
 */
@Component({
  selector: 'app-performance-chart',
  imports: [ChartModule],
  template: `<p-chart type="line" [data]="chartData()" [options]="chartOptions()" height="22rem" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceChartComponent {
  private readonly theme = inject(ThemeService);

  /** Les labels de l'axe X (ex: dates formatées), partagés par toutes les séries. */
  readonly labels = input.required<string[]>();
  readonly series = input.required<ChartSeries[]>();
  /** Unité affichée dans les tooltips et sur l'axe Y (ex: "kg", "reps", "s"). */
  readonly unit = input('');

  /** Lit un token CSS de thème en valeur résolue — Chart.js dessine sur un <canvas>, pas de var() possible. */
  private readColor(cssVar: string, fallback: string): string {
    const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    return value || fallback;
  }

  readonly chartData = computed(() => ({
    labels: this.labels(),
    datasets: this.series().map((serie, index) => {
      const color = SERIES_COLORS[index % SERIES_COLORS.length];
      return {
        label: serie.label,
        data: serie.data,
        borderColor: color,
        backgroundColor: color,
        spanGaps: true, // relie la ligne au-dessus des séances où cet exercice n'a pas été fait
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
      };
    }),
  }));

  readonly chartOptions = computed(() => {
    // On lit le thème pour dépendre du signal (recalcul au changement clair/sombre) ; les
    // couleurs elles-mêmes sont résolues juste après via getComputedStyle, toujours à jour.
    this.theme.resolved();

    const textColor = this.readColor('--app-color-text-muted', '#6b7280');
    const gridColor = this.readColor('--app-color-surface-border', '#e5e7eb');
    const unit = this.unit();

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          labels: { color: textColor },
        },
        tooltip: {
          callbacks: unit
            ? {
                label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) =>
                  context.parsed.y == null ? '' : `${context.dataset.label} : ${context.parsed.y} ${unit}`,
              }
            : undefined,
        },
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor },
          beginAtZero: true,
        },
      },
    };
  });
}
