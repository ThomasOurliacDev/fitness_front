import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { EntrainementService } from '../entrainement.service';
import {
  bodyPartLabel,
  primaryGroupLabel,
  PRIMARY_GROUP_ORDER,
  CreateSetTemplatePayload,
  Exercise,
  Program,
  Workout,
  WorkoutExercise,
} from '../entrainement.model';
import { ToasterService } from '../../../core/notifications/toaster.service';

interface ExerciseGroup {
  label: string;
  primary: string;
  items: Exercise[];
}

/** Un groupe musculaire au sein d'une séance (pour l'affichage groupé). */
interface WorkoutExerciseGroup {
  label: string;
  items: WorkoutExercise[];
}

@Component({
  selector: 'app-program-detail',
  imports: [
    ButtonModule,
    ConfirmPopupModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    FloatLabelModule,
    SkeletonModule,
    TagModule,
    ReactiveFormsModule,
    DragDropModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './program-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './program-detail.component.scss',
})
export class ProgramDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toaster = inject(ToasterService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);
  readonly entrainementService = inject(EntrainementService);

  readonly program = signal<Program | null>(null);
  readonly loading = signal(true);
  readonly exercises = signal<Exercise[]>([]);
  readonly reordering = signal(false);
  readonly bodyPartLabel = bodyPartLabel;

  /** Les séances repliées (fermées) — toutes ouvertes par défaut. */
  readonly collapsedWorkouts = signal<Set<string>>(new Set());

  /** Le catalogue regroupé par groupe musculaire pour le dropdown (sous-catégories). */
  readonly exerciseGroups = computed<ExerciseGroup[]>(() => {
    const groups = new Map<string, Exercise[]>();

    for (const exercise of this.exercises()) {
      const items = groups.get(exercise.bodyPart) ?? [];
      items.push(exercise);
      groups.set(exercise.bodyPart, items);
    }

    // Tri : d'abord par famille (Pectoraux, Dos, Épaules, Bras, Jambes...), puis par groupe fin
    const primaryRank = (primary: string) => {
      const rank = PRIMARY_GROUP_ORDER.indexOf(primary);
      return rank === -1 ? PRIMARY_GROUP_ORDER.length : rank;
    };

    return Array.from(groups.entries())
      .map(([bodyPart, items]) => ({
        label: bodyPartLabel(bodyPart),
        primary: primaryGroupLabel(bodyPart),
        items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => primaryRank(a.primary) - primaryRank(b.primary) || a.label.localeCompare(b.label));
  });

  private programId = '';

  // --- Dialog "Ajouter une séance" ---
  readonly workoutDialogVisible = signal(false);
  readonly savingWorkout = signal(false);

  readonly workoutForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]]
  });

  // --- Dialog "Ajouter / Modifier un exercice" ---
  readonly exerciseDialogVisible = signal(false);
  readonly savingExercise = signal(false);
  /** L'exercice de séance en cours d'édition (null = mode ajout). */
  readonly editingExercise = signal<WorkoutExercise | null>(null);
  /** La séance dans laquelle on ajoute/modifie un exercice. */
  targetWorkout: Workout | null = null;

  readonly exerciseForm: FormGroup = this.fb.group({
    exerciseId: [null as string | null, Validators.required],
    // Surcharge progressive : plafond de reps avant que la séance suggère d'ajouter du poids
    maxReps: [12, [Validators.required, Validators.min(1), Validators.max(50)]],
    sets: this.fb.array([])
  });

  get setsArray(): FormArray {
    return this.exerciseForm.get('sets') as FormArray;
  }

  ngOnInit(): void {
    this.programId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadProgram();

    this.entrainementService.getExercises().subscribe({
      next: (exercises) => this.exercises.set(exercises),
      error: () => this.toaster.error('Exercices', "Impossible de charger le catalogue d'exercices."),
    });
  }

  loadProgram(): void {
    this.entrainementService.getProgram(this.programId).subscribe({
      next: (program) => {
        this.program.set(program);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toaster.error('Programme', 'Impossible de charger ce programme.');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/entrainement']);
  }

  // --- Séances ---

  openWorkoutDialog(): void {
    this.workoutForm.reset({ name: '' });
    this.workoutDialogVisible.set(true);
  }

  onCreateWorkout(): void {
    if (this.workoutForm.invalid) {
      this.workoutForm.markAllAsTouched();
      return;
    }

    const { name } = this.workoutForm.value;

    this.savingWorkout.set(true);
    this.entrainementService.createWorkout({ name, programId: this.programId }).subscribe({
      next: (workout) => {
        this.savingWorkout.set(false);
        this.workoutDialogVisible.set(false);
        this.toaster.success('Séance ajoutée', `« ${workout.name} » fait partie du programme.`);
        this.loadProgram();
      },
      error: () => {
        this.savingWorkout.set(false);
        this.toaster.error('Séances', "L'ajout de la séance a échoué.");
      },
    });
  }

  // --- Lancer une séance ---

  readonly startingWorkoutId = signal<string | null>(null);

  startWorkoutSession(workout: Workout): void {
    this.startingWorkoutId.set(workout.id);
    this.entrainementService.startSession(workout.id).subscribe({
      next: () => {
        this.startingWorkoutId.set(null);
        this.router.navigate(['/entrainement/session']);
      },
      error: (err: unknown) => {
        this.startingWorkoutId.set(null);
        if (err instanceof HttpErrorResponse && err.status === 409) {
          // Une séance est déjà en cours : on y emmène l'utilisateur
          this.toaster.warn('Séance en cours', 'Tu as déjà une séance active, reprends-la ou termine-la.');
          this.router.navigate(['/entrainement/session']);
        } else {
          this.toaster.error('Séance', 'Impossible de démarrer la séance.');
        }
      },
    });
  }

  toggleWorkout(workoutId: string): void {
    this.collapsedWorkouts.update((collapsed) => {
      const next = new Set(collapsed);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  }

  isWorkoutCollapsed(workoutId: string): boolean {
    return this.collapsedWorkouts().has(workoutId);
  }

  // --- Affichage groupé et réordonnancement ---

  /** Les exercices d'une séance regroupés par groupe musculaire (groupes triés par ordre d'apparition). */
  workoutGroups(workout: Workout): WorkoutExerciseGroup[] {
    const byPart = new Map<string, WorkoutExercise[]>();

    for (const workoutExercise of workout.exercises ?? []) {
      const part = workoutExercise.exercise?.bodyPart ?? 'AUTRE';
      const items = byPart.get(part) ?? [];
      items.push(workoutExercise);
      byPart.set(part, items);
    }

    return Array.from(byPart.entries())
      .map(([part, items]) => ({
        label: bodyPartLabel(part),
        items: [...items].sort((a, b) => a.order - b.order),
        minOrder: Math.min(...items.map((item) => item.order)),
      }))
      .sort((a, b) => a.minOrder - b.minOrder);
  }

  /** Drop d'un exercice au sein de son groupe musculaire. */
  onExerciseDrop(workout: Workout, groupLabel: string, event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;

    const groups = this.workoutGroups(workout);
    const group = groups.find((candidate) => candidate.label === groupLabel);
    if (!group) return;

    const items = [...group.items];
    moveItemInArray(items, event.previousIndex, event.currentIndex);

    // La permutation complète de la séance : groupes aplatis dans l'ordre d'affichage
    const orderedIds = groups.flatMap((candidate) =>
      (candidate.label === groupLabel ? items : candidate.items).map((workoutExercise) => workoutExercise.id)
    );

    this.applyReorder(workout, orderedIds);
  }

  /** Drop d'un groupe musculaire entier (tous ses exercices se déplacent en bloc). */
  onGroupDrop(workout: Workout, event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;

    const groups = this.workoutGroups(workout);
    const reordered = [...groups];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    const orderedIds = reordered.flatMap((group) => group.items.map((workoutExercise) => workoutExercise.id));

    this.applyReorder(workout, orderedIds);
  }

  /** Applique le nouvel ordre en optimiste (pas de flash), puis persiste côté back. */
  private applyReorder(workout: Workout, orderedIds: string[]): void {
    const orderById = new Map(orderedIds.map((id, index) => [id, index + 1]));
    for (const workoutExercise of workout.exercises ?? []) {
      const newOrder = orderById.get(workoutExercise.id);
      if (newOrder != null) {
        workoutExercise.order = newOrder;
      }
    }
    // Nouvelle référence pour déclencher le re-render du signal
    this.program.update((program) => (program ? { ...program } : program));

    this.reordering.set(true);
    this.entrainementService.reorderWorkoutExercises({ workoutId: workout.id, orderedIds }).subscribe({
      next: () => this.reordering.set(false),
      error: () => {
        this.reordering.set(false);
        this.toaster.error('Exercices', 'Le réordonnancement a échoué.');
        this.loadProgram(); // On resynchronise avec l'état réel de la base
      },
    });
  }

  // --- Exercices (suppression) ---

  readonly deletingExerciseId = signal<string | null>(null);

  confirmDeleteExercise(event: Event, workoutExercise: WorkoutExercise): void {
    const name = workoutExercise.exercise?.name ?? 'cet exercice';
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Supprimer « ${name} » de la séance ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Supprimer', severity: 'danger' },
      rejectButtonProps: { label: 'Annuler', severity: 'secondary', text: true },
      accept: () => this.deleteExercise(workoutExercise),
    });
  }

  private deleteExercise(workoutExercise: WorkoutExercise): void {
    const name = workoutExercise.exercise?.name ?? 'Exercice';
    this.deletingExerciseId.set(workoutExercise.id);
    this.entrainementService.deleteWorkoutExercise(workoutExercise.id).subscribe({
      next: () => {
        this.deletingExerciseId.set(null);
        this.toaster.success('Exercice supprimé', `« ${name} » a été retiré de la séance.`);
        this.loadProgram();
      },
      error: () => {
        this.deletingExerciseId.set(null);
        this.toaster.error('Exercices', 'La suppression a échoué.');
      },
    });
  }

  // --- Exercices (ajout / édition) ---

  openExerciseDialog(workout: Workout): void {
    this.targetWorkout = workout;
    this.editingExercise.set(null);
    this.exerciseForm.reset({ exerciseId: null, maxReps: 12 });
    this.setsArray.clear();
    this.addSet();
    this.exerciseDialogVisible.set(true);
  }

  openEditExerciseDialog(workout: Workout, workoutExercise: WorkoutExercise): void {
    this.targetWorkout = workout;
    this.editingExercise.set(workoutExercise);
    this.exerciseForm.reset({ exerciseId: workoutExercise.exerciseId, maxReps: workoutExercise.maxReps ?? 12 });
    this.setsArray.clear();

    const sets = workoutExercise.sets ?? [];
    if (sets.length === 0) {
      this.addSet();
    } else {
      for (const set of sets) {
        this.pushSetRow(set);
      }
    }

    this.exerciseDialogVisible.set(true);
  }

  exerciseDialogHeader(): string {
    return this.editingExercise() ? "Modifier l'exercice" : 'Ajouter un exercice';
  }

  /** L'exercice sélectionné dans le dialog se mesure-t-il en durée (gainage, cardio...) ? */
  isTimeBased(): boolean {
    const exerciseId = this.exerciseForm.get('exerciseId')?.value as string | null;
    return this.exercises().find((exercise) => exercise.id === exerciseId)?.measure === 'TIME';
  }

  /** L'incrément de poids (progression) de l'exercice sélectionné, affiché en aide dans le dialog. */
  selectedWeightIncrement(): number | null {
    const exerciseId = this.exerciseForm.get('exerciseId')?.value as string | null;
    const exercise = this.exercises().find((candidate) => candidate.id === exerciseId);
    return exercise ? (exercise.weightIncrement ?? 1) : null;
  }

  /** Ajoute une ligne de série (par défaut : 10 reps ou 30s, 90s de repos). */
  addSet(): void {
    this.pushSetRow();
  }

  private pushSetRow(values?: {
    targetReps?: number | null;
    targetDuration?: number | null;
    targetWeight?: number | null;
    restTime?: number;
  }): void {
    this.setsArray.push(this.fb.group({
      targetReps: [values?.targetReps ?? 10, Validators.min(1)],
      targetDuration: [values?.targetDuration ?? 30, Validators.min(1)],
      targetWeight: [values?.targetWeight ?? null, Validators.min(0)],
      restTime: [values?.restTime ?? 90, [Validators.required, Validators.min(0)]]
    }));
  }

  removeSet(index: number): void {
    if (this.setsArray.length > 1) {
      this.setsArray.removeAt(index);
    }
  }

  onSubmitExercise(): void {
    if (this.exerciseForm.invalid) {
      this.exerciseForm.markAllAsTouched();
      return;
    }

    const workout = this.targetWorkout;
    if (!workout) return;

    const { exerciseId, maxReps } = this.exerciseForm.value;

    // Selon la mesure de l'exercice, on envoie soit les répétitions, soit la durée
    const timeBased = this.isTimeBased();

    const sets: CreateSetTemplatePayload[] = (
      this.setsArray.value as { targetReps: number | null; targetDuration: number | null; targetWeight: number | null; restTime: number }[]
    ).map((set, index) => ({
      targetReps: timeBased ? undefined : (set.targetReps ?? undefined),
      targetDuration: timeBased ? (set.targetDuration ?? undefined) : undefined,
      targetWeight: set.targetWeight ?? undefined,
      restTime: set.restTime,
      order: index + 1
    }));

    const exerciseName = this.exercises().find((exercise) => exercise.id === exerciseId)?.name ?? 'Exercice';
    const editing = this.editingExercise();

    this.savingExercise.set(true);

    const request$ = editing
      ? this.entrainementService.updateWorkoutExercise(editing.id, { exerciseId, maxReps: maxReps ?? undefined, sets })
      : this.entrainementService.addExerciseToWorkout({
          workoutId: workout.id,
          exerciseId,
          // L'ordre : on ajoute toujours à la suite des exercices existants
          order: (workout.exercises?.length ?? 0) + 1,
          maxReps: maxReps ?? undefined,
          sets
        });

    request$.subscribe({
      next: () => {
        this.savingExercise.set(false);
        this.exerciseDialogVisible.set(false);
        this.toaster.success(
          editing ? 'Exercice modifié' : 'Exercice ajouté',
          editing ? `« ${exerciseName} » a été mis à jour.` : `« ${exerciseName} » ajouté à « ${workout.name} ».`
        );
        this.loadProgram();
      },
      error: () => {
        this.savingExercise.set(false);
        this.toaster.error('Exercices', editing ? 'La modification a échoué.' : "L'ajout de l'exercice a échoué.");
      },
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string | null {
    const field = form.get(fieldName);

    if (!field || !field.touched || !field.errors) {
      return null;
    }

    if (field.errors['required']) {
      return 'Ce champ est obligatoire';
    }

    if (field.errors['maxlength']) {
      return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
    }

    return 'Champ invalide';
  }
}
