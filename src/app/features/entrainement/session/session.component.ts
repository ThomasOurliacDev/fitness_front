import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { EntrainementService } from '../entrainement.service';
import { bodyPartLabel, formatDuration, LoggedSet, SetTemplate, WorkoutExercise, WorkoutSession } from '../entrainement.model';
import { ToasterService } from '../../../core/notifications/toaster.service';

/** Une ligne de série à réaliser : l'objectif du template + la saisie du réel. */
interface SetRow {
  template: SetTemplate;
  done: LoggedSet | null;
  reps: number | null;
  duration: number | null;
  weight: number | null;
  saving: boolean;
}

/** Un exercice de la séance avec ses lignes de séries. */
interface ExerciseBlock {
  workoutExercise: WorkoutExercise;
  timeBased: boolean;
  rows: SetRow[];
}

/** Une "étape" du player : une série précise d'un exercice précis. */
interface Step {
  block: ExerciseBlock;
  row: SetRow;
  setNumber: number; // n° de la série dans l'exercice (1-based)
  setCount: number; // nb total de séries de l'exercice
}

@Component({
  selector: 'app-session',
  imports: [ButtonModule, InputNumberModule, SkeletonModule, TagModule, FormsModule],
  templateUrl: './session.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './session.component.scss',
})
export class SessionComponent implements OnInit, OnDestroy {

  private readonly router = inject(Router);
  private readonly toaster = inject(ToasterService);
  readonly entrainementService = inject(EntrainementService);

  readonly session = signal<WorkoutSession | null>(null);
  readonly loading = signal(true);
  readonly finishing = signal(false);
  readonly blocks = signal<ExerciseBlock[]>([]);
  readonly elapsedSeconds = signal(0);
  readonly bodyPartLabel = bodyPartLabel;

  /** Index (dans steps()) de la série en cours ; -1 si tout est fait. */
  readonly currentIndex = signal(-1);
  /** Secondes de repos restantes ; null = pas en repos. */
  readonly restRemaining = signal<number | null>(null);
  readonly restTotal = signal(0);

  /** Toutes les séries de la séance, aplaties dans l'ordre d'exécution. */
  readonly steps = computed<Step[]>(() => {
    const steps: Step[] = [];
    for (const block of this.blocks()) {
      block.rows.forEach((row, index) => {
        steps.push({ block, row, setNumber: index + 1, setCount: block.rows.length });
      });
    }
    return steps;
  });

  readonly currentStep = computed<Step | null>(() => this.steps()[this.currentIndex()] ?? null);
  readonly allDone = computed(() => this.steps().length > 0 && this.steps().every((step) => step.row.done));
  readonly resting = computed(() => this.restRemaining() !== null);

  /** Ordre chronologique global des séries loggées dans la session. */
  private loggedCount = 0;
  private timer?: ReturnType<typeof setInterval>;
  private restTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.entrainementService.getActiveSession().subscribe({
      next: (session) => {
        this.session.set(session);
        this.loading.set(false);
        if (session) {
          this.loggedCount = session.sets?.length ?? 0;
          this.blocks.set(this.buildBlocks(session));
          this.currentIndex.set(this.findNextPending(-1));
          this.startTimer(session);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toaster.error('Séance', 'Impossible de charger la séance en cours.');
      },
    });
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.clearRestTimer();
  }

  goBack(): void {
    this.router.navigate(['/entrainement']);
  }

  // --- Chrono de séance ---

  private startTimer(session: WorkoutSession): void {
    const startedAt = new Date(session.date).getTime();
    const tick = () => this.elapsedSeconds.set(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    this.timer = setInterval(tick, 1000);
  }

  formatElapsed(): string {
    return formatDuration(this.elapsedSeconds());
  }

  // --- Construction de la vue ---

  /** Associe les séries déjà loggées aux lignes du template (par exercice, dans l'ordre). */
  private buildBlocks(session: WorkoutSession): ExerciseBlock[] {
    const loggedByExercise = new Map<string, LoggedSet[]>();
    for (const loggedSet of session.sets ?? []) {
      const list = loggedByExercise.get(loggedSet.exerciseId) ?? [];
      list.push(loggedSet);
      loggedByExercise.set(loggedSet.exerciseId, list);
    }

    return (session.workout?.exercises ?? []).map((workoutExercise) => {
      const timeBased = workoutExercise.exercise?.measure === 'TIME';
      const logged = loggedByExercise.get(workoutExercise.exerciseId) ?? [];

      const rows: SetRow[] = (workoutExercise.sets ?? []).map((template, index) => {
        const done = logged[index] ?? null;
        return {
          template,
          done,
          // Saisie pré-remplie avec l'objectif du jour — la suggestion de progression
          // calculée par le back si dispo, sinon le template (ou le réalisé si déjà loggé)
          reps: done ? done.reps : (template.suggestedReps ?? template.targetReps),
          duration: done ? done.duration : template.targetDuration,
          weight: done ? done.weight : (template.suggestedWeight ?? template.targetWeight),
          saving: false,
        };
      });

      return { workoutExercise, timeBased, rows };
    });
  }

  totalCount(): number {
    return this.blocks().reduce((total, block) => total + block.rows.length, 0);
  }

  doneCount(): number {
    return this.blocks().reduce((total, block) => total + block.rows.filter((row) => row.done).length, 0);
  }

  isBlockDone(block: ExerciseBlock): boolean {
    return block.rows.length > 0 && block.rows.every((row) => row.done);
  }

  isCurrentRow(row: SetRow): boolean {
    return this.currentStep()?.row === row;
  }

  /** "8 reps @ 60 kg" / "45 s" — l'objectif du jour (suggestion de progression si dispo). */
  targetLabel(step: Step): string {
    return this.rowTarget(step.block, step.row);
  }

  rowTarget(block: ExerciseBlock, row: SetRow): string {
    const template = row.template;
    const base = block.timeBased
      ? `${template.targetDuration ?? '?'} s`
      : `${template.suggestedReps ?? template.targetReps ?? '?'} reps`;
    const weight = template.suggestedWeight ?? template.targetWeight;
    return weight != null ? `${base} @ ${weight} kg` : base;
  }

  /** Badge de surcharge progressive affiché sur la série en cours. */
  progressionBadge(step: Step): { label: string; kind: 'up' | 'keep' } | null {
    switch (step.row.template.progression) {
      case 'REPS_UP':
        return { label: '+1 rep vs la dernière séance', kind: 'up' };
      case 'WEIGHT_UP': {
        const increment = step.block.workoutExercise.exercise?.weightIncrement ?? 1;
        return { label: `+${increment} kg — plafond de reps atteint !`, kind: 'up' };
      }
      case 'KEEP':
        return { label: 'Consolidation : même objectif que la dernière fois', kind: 'keep' };
      default:
        return null;
    }
  }

  hasProgressionUp(row: SetRow): boolean {
    return row.template.progression === 'REPS_UP' || row.template.progression === 'WEIGHT_UP';
  }

  /** "8 reps @ 60 kg" — ce qui a réellement été fait sur une série validée. */
  doneLabel(block: ExerciseBlock, row: SetRow): string {
    if (!row.done) return '';
    const base = block.timeBased ? `${row.done.duration ?? '?'} s` : `${row.done.reps ?? '?'} reps`;
    return row.done.weight != null ? `${base} @ ${row.done.weight} kg` : base;
  }

  // --- Player : valider / rater une série ---

  validateSet(success: boolean): void {
    const session = this.session();
    const step = this.currentStep();
    if (!session || !step || step.row.done || step.row.saving || this.resting()) return;

    const row = step.row;
    row.saving = true;
    this.blocks.update((blocks) => [...blocks]);

    this.entrainementService.logSet({
      workoutSessionId: session.id,
      exerciseId: step.block.workoutExercise.exerciseId,
      reps: step.block.timeBased ? undefined : (row.reps ?? undefined),
      duration: step.block.timeBased ? (row.duration ?? undefined) : undefined,
      weight: row.weight ?? undefined,
      restTime: row.template.restTime,
      order: this.loggedCount + 1,
      success,
    }).subscribe({
      next: (loggedSet) => {
        this.loggedCount++;
        row.saving = false;
        row.done = loggedSet;
        this.blocks.update((blocks) => [...blocks]);

        const nextIndex = this.findNextPending(this.currentIndex());
        this.currentIndex.set(nextIndex);
        // Repos seulement s'il reste des séries à faire
        if (nextIndex !== -1 && row.template.restTime > 0) {
          this.startRest(row.template.restTime);
        }
      },
      error: () => {
        row.saving = false;
        this.blocks.update((blocks) => [...blocks]);
        this.toaster.error('Séries', "L'enregistrement de la série a échoué.");
      },
    });
  }

  /** Cliquer une série non faite dans le déroulé pour la faire maintenant. */
  jumpToRow(row: SetRow): void {
    if (row.done) return;
    const index = this.steps().findIndex((step) => step.row === row);
    if (index !== -1) {
      this.currentIndex.set(index);
    }
  }

  private findNextPending(after: number): number {
    const steps = this.steps();
    // D'abord la suite logique de la séance…
    for (let i = after + 1; i < steps.length; i++) {
      if (!steps[i].row.done) return i;
    }
    // …sinon une série sautée plus tôt (l'utilisateur a pu changer l'ordre)
    for (let i = 0; i <= after && i < steps.length; i++) {
      if (!steps[i].row.done) return i;
    }
    return -1;
  }

  // --- Repos ---

  private startRest(seconds: number): void {
    this.clearRestTimer();
    this.restTotal.set(seconds);
    this.restRemaining.set(seconds);
    this.restTimer = setInterval(() => {
      const remaining = (this.restRemaining() ?? 1) - 1;
      if (remaining <= 0) {
        this.endRest();
        this.notifyRestOver();
      } else {
        this.restRemaining.set(remaining);
      }
    }, 1000);
  }

  skipRest(): void {
    this.endRest();
  }

  extendRest(): void {
    if (!this.resting()) return;
    this.restRemaining.update((remaining) => (remaining ?? 0) + 30);
    this.restTotal.update((total) => total + 30);
  }

  private endRest(): void {
    this.clearRestTimer();
    this.restRemaining.set(null);
  }

  private clearRestTimer(): void {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = undefined;
    }
  }

  formatRest(): string {
    return formatDuration(this.restRemaining() ?? 0);
  }

  restProgress(): number {
    const total = this.restTotal();
    const remaining = this.restRemaining() ?? 0;
    return total > 0 ? (remaining / total) * 100 : 0;
  }

  /** Double bip + vibration à la fin du repos (best effort : silencieux si non supporté). */
  private notifyRestOver(): void {
    try {
      navigator.vibrate?.(200);
    } catch { /* non supporté */ }
    try {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') void ctx.resume();
      const playTone = (offset: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.2);
      };
      playTone(0);
      playTone(0.25);
      setTimeout(() => void ctx.close(), 800);
    } catch { /* audio non dispo */ }
  }

  // --- Fin de séance ---

  finish(): void {
    const session = this.session();
    if (!session) return;

    this.finishing.set(true);
    this.entrainementService.finishSession(session.id).subscribe({
      next: (finished) => {
        this.finishing.set(false);
        this.toaster.success(
          'Séance terminée',
          `Bien joué ! ${this.doneCount()}/${this.totalCount()} séries en ${formatDuration(finished.duration ?? 0)}.`
        );
        this.router.navigate(['/entrainement']);
      },
      error: () => {
        this.finishing.set(false);
        this.toaster.error('Séance', 'Impossible de terminer la séance.');
      },
    });
  }
}
