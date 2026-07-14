import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { MultiSelectModule, MultiSelectChangeEvent } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { EntrainementService } from '../entrainement/entrainement.service';
import {
  bodyPartLabel,
  ExerciseProgress,
  formatDuration,
  LoggedExercise,
  ProgressMetric,
  PROGRESS_METRIC_OPTIONS,
  SessionStats,
} from '../entrainement/entrainement.model';
import { ToasterService } from '../../core/notifications/toaster.service';
import { ChartSeries, PerformanceChartComponent } from '../../shared/ui/performance-chart/performance-chart.component';

interface BodyPartRow {
  label: string;
  count: number;
  percent: number;
}

/** Ce qu'on garde d'une visite à l'autre : quels exercices et quelle métrique regarder. */
const SELECTION_STORAGE_KEY = 'app.activity.progressSelection';

interface StoredSelection {
  exerciseIds: string[];
  metric: ProgressMetric;
}

@Component({
  selector: 'app-activity',
  imports: [CardModule, SkeletonModule, FormsModule, MultiSelectModule, SelectModule, PerformanceChartComponent],
  templateUrl: './activity.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './activity.component.scss',
})
export default class ActivityComponent implements OnInit {

  private readonly entrainementService = inject(EntrainementService);
  private readonly toaster = inject(ToasterService);

  readonly stats = signal<SessionStats | null>(null);
  readonly loading = signal(true);

  // --- Suivi des performances (graphique) ---
  readonly loggedExercises = signal<LoggedExercise[]>([]);
  readonly loadingExercises = signal(true);
  readonly selectedExerciseIds = signal<string[]>([]);
  readonly selectedMetric = signal<ProgressMetric>('maxWeight');
  readonly progressData = signal<ExerciseProgress[]>([]);
  readonly loadingProgress = signal(false);
  readonly metricOptions = PROGRESS_METRIC_OPTIONS;

  /** Répartition par groupe musculaire, triée du plus au moins travaillé. */
  readonly bodyPartRows = computed<BodyPartRow[]>(() => {
    const stats = this.stats();
    if (!stats) return [];

    const total = stats.totalSetsLast90Days;
    return Object.entries(stats.bodyPartBreakdownLast90Days)
      .map(([bodyPart, count]) => ({
        label: bodyPartLabel(bodyPart),
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  });

  /** Toutes les dates (ISO) où au moins un des exercices sélectionnés a une performance, triées. */
  private readonly chartDates = computed<string[]>(() => {
    const dates = new Set<string>();
    for (const exercise of this.progressData()) {
      for (const point of exercise.points) {
        dates.add(point.date);
      }
    }
    return Array.from(dates).sort();
  });

  readonly chartLabels = computed<string[]>(() =>
    this.chartDates().map((iso) => formatDate(iso, 'dd/MM/yy', 'fr-FR'))
  );

  readonly chartSeries = computed<ChartSeries[]>(() => {
    const dates = this.chartDates();
    const metric = this.selectedMetric();
    return this.progressData().map((exercise) => {
      const byDate = new Map(exercise.points.map((point) => [point.date, point[metric]]));
      return { label: exercise.exerciseName, data: dates.map((date) => byDate.get(date) ?? null) };
    });
  });

  readonly chartUnit = computed(() => this.metricOptions.find((option) => option.value === this.selectedMetric())?.unit ?? '');

  ngOnInit(): void {
    this.entrainementService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toaster.error('Activité', "Impossible de charger tes statistiques.");
      },
    });

    this.entrainementService.getLoggedExercises().subscribe({
      next: (exercises) => {
        this.loggedExercises.set(exercises);
        this.loadingExercises.set(false);
        this.restoreSelection(exercises);
      },
      error: () => {
        this.loadingExercises.set(false);
        this.toaster.error('Progression', "Impossible de charger la liste de tes exercices.");
      },
    });
  }

  formatTotalDuration(): string {
    return formatDuration(this.stats()?.totalDurationSeconds ?? 0);
  }

  /** Les chips reflètent chaque coche immédiatement ; la requête part seulement à la fermeture. */
  onExerciseSelectionChange(event: MultiSelectChangeEvent): void {
    this.selectedExerciseIds.set(event.value as string[]);
  }

  onExercisePanelHide(): void {
    this.persistSelection();
    this.loadProgress();
  }

  onMetricChange(metric: ProgressMetric): void {
    this.selectedMetric.set(metric);
    this.persistSelection();
    // Pas de nouvel appel réseau : la métrique ne fait que changer quel champ des points déjà
    // chargés on affiche (chartSeries le recalcule tout seul).
  }

  private loadProgress(): void {
    const ids = this.selectedExerciseIds();
    if (ids.length === 0) {
      this.progressData.set([]);
      return;
    }

    this.loadingProgress.set(true);
    this.entrainementService.getExerciseProgress(ids).subscribe({
      next: (data) => {
        this.progressData.set(data);
        this.loadingProgress.set(false);
      },
      error: () => {
        this.loadingProgress.set(false);
        this.toaster.error('Progression', "Impossible de charger l'historique de performance.");
      },
    });
  }

  /** Restaure la dernière sélection (exercices + métrique), en ignorant les exercices supprimés depuis. */
  private restoreSelection(availableExercises: LoggedExercise[]): void {
    try {
      const raw = localStorage.getItem(SELECTION_STORAGE_KEY);
      if (!raw) return;

      const stored = JSON.parse(raw) as StoredSelection;
      const availableIds = new Set(availableExercises.map((exercise) => exercise.id));
      const restoredIds = (stored.exerciseIds ?? []).filter((id) => availableIds.has(id));

      this.selectedExerciseIds.set(restoredIds);
      if (stored.metric && this.metricOptions.some((option) => option.value === stored.metric)) {
        this.selectedMetric.set(stored.metric);
      }
      this.loadProgress();
    } catch {
      // Sélection corrompue ou absente : on repart simplement sans rien de pré-sélectionné.
    }
  }

  private persistSelection(): void {
    const selection: StoredSelection = { exerciseIds: this.selectedExerciseIds(), metric: this.selectedMetric() };
    try {
      localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selection));
    } catch {
      // localStorage indisponible (navigation privée...) : tant pis, pas de persistance.
    }
  }
}
