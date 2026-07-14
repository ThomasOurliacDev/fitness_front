import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { EntrainementService } from '../entrainement/entrainement.service';
import { bodyPartLabel, formatDuration, HistorySession, HistorySet } from '../entrainement/entrainement.model';
import { ToasterService } from '../../core/notifications/toaster.service';

/** Les séries d'une séance passée, regroupées par exercice dans l'ordre où elles ont été faites. */
interface HistoryBlock {
  exerciseName: string;
  bodyPart: string;
  sets: HistorySet[];
}

@Component({
  selector: 'app-history',
  imports: [ButtonModule, SkeletonModule, TagModule, DatePipe],
  templateUrl: './history.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './history.component.scss',
})
export default class HistoryComponent implements OnInit {

  private readonly entrainementService = inject(EntrainementService);
  private readonly toaster = inject(ToasterService);

  readonly sessions = signal<HistorySession[]>([]);
  readonly loading = signal(true);
  readonly expanded = signal<Set<string>>(new Set());
  readonly bodyPartLabel = bodyPartLabel;
  readonly formatDuration = formatDuration;

  ngOnInit(): void {
    this.entrainementService.getHistory().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toaster.error('Historique', "Impossible de charger l'historique des séances.");
      },
    });
  }

  toggle(sessionId: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }

  isExpanded(sessionId: string): boolean {
    return this.expanded().has(sessionId);
  }

  workoutLabel(session: HistorySession): string {
    return session.workout?.name ?? 'Séance supprimée';
  }

  programLabel(session: HistorySession): string | null {
    return session.workout?.program.name ?? null;
  }

  successCount(session: HistorySession): number {
    return session.sets.filter((set) => set.success).length;
  }

  /** Les séries d'une séance regroupées par exercice, dans l'ordre de première apparition. */
  blocksOf(session: HistorySession): HistoryBlock[] {
    const blocks: HistoryBlock[] = [];
    const indexByExercise = new Map<string, number>();

    for (const set of session.sets) {
      let index = indexByExercise.get(set.exerciseId);
      if (index === undefined) {
        index = blocks.length;
        indexByExercise.set(set.exerciseId, index);
        blocks.push({ exerciseName: set.exercise.name, bodyPart: set.exercise.bodyPart, sets: [] });
      }
      blocks[index].sets.push(set);
    }

    return blocks;
  }

  setLabel(set: HistorySet): string {
    const base = set.exercise.measure === 'TIME' ? `${set.duration ?? '?'} s` : `${set.reps ?? '?'} reps`;
    return set.weight != null ? `${base} @ ${set.weight} kg` : base;
  }
}
