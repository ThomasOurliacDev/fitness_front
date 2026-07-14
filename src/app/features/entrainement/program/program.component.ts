import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { EntrainementService } from '../entrainement.service';
import { bodyPartLabel, Program } from '../entrainement.model';
import { ToasterService } from '../../../core/notifications/toaster.service';

@Component({
  selector: 'app-program',
  imports: [
    CardModule,
    ButtonModule,
    ConfirmPopupModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    FloatLabelModule,
    SkeletonModule,
    TagModule,
    ReactiveFormsModule,
    DatePipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './program.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './program.component.scss',
})
export class ProgramComponent implements OnInit {

  readonly entrainementService = inject(EntrainementService);
  private readonly toaster = inject(ToasterService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly programs = signal<Program[]>([]);
  readonly loading = signal(true);
  readonly deletingProgramId = signal<string | null>(null);

  // --- Création de programme ---
  readonly dialogVisible = signal(false);
  readonly saving = signal(false);

  readonly programForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)]
  });

  ngOnInit(): void {
    this.entrainementService.getPrograms().subscribe({
      next: (programs) => {
        this.programs.set(programs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toaster.error('Programmes', 'Impossible de charger tes programmes.');
      },
    });
  }

  openProgram(program: Program): void {
    this.router.navigate(['/entrainement/program', program.id]);
  }

  /** Ouvre le popup de confirmation ; stoppe la propagation pour ne pas déclencher openProgram(). */
  confirmDeleteProgram(event: Event, program: Program): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Supprimer « ${program.name} » et toutes ses séances ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Supprimer', severity: 'danger' },
      rejectButtonProps: { label: 'Annuler', severity: 'secondary', text: true },
      accept: () => this.deleteProgram(program),
    });
  }

  private deleteProgram(program: Program): void {
    this.deletingProgramId.set(program.id);
    this.entrainementService.deleteProgram(program.id).subscribe({
      next: () => {
        this.deletingProgramId.set(null);
        this.programs.update((list) => list.filter((candidate) => candidate.id !== program.id));
        this.toaster.success('Programme supprimé', `« ${program.name} » a été supprimé.`);
      },
      error: (err: unknown) => {
        this.deletingProgramId.set(null);
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.toaster.warn('Séance en cours', 'Termine la séance en cours avant de supprimer ce programme.');
        } else {
          this.toaster.error('Programmes', 'La suppression a échoué.');
        }
      },
    });
  }

  /** Les groupes musculaires travaillés par un programme (libellés français, triés). */
  programGroups(program: Program): string[] {
    const labels = new Set<string>();

    for (const workout of program.workouts ?? []) {
      for (const workoutExercise of workout.exercises ?? []) {
        if (workoutExercise.exercise?.bodyPart) {
          labels.add(bodyPartLabel(workoutExercise.exercise.bodyPart));
        }
      }
    }

    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }

  openCreateDialog(): void {
    this.programForm.reset({ name: '', description: '' });
    this.dialogVisible.set(true);
  }

  onCreate(): void {
    if (this.programForm.invalid) {
      this.programForm.markAllAsTouched();
      return;
    }

    const { name, description } = this.programForm.value;

    this.saving.set(true);
    this.entrainementService.createProgram({ name, description: description || undefined }).subscribe({
      next: (program) => {
        // Le programme tout neuf passe en tête de liste (tri par createdAt desc côté back)
        this.programs.update((list) => [program, ...list]);
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.toaster.success('Programme créé', `« ${program.name} » est prêt.`);
      },
      error: () => {
        this.saving.set(false);
        this.toaster.error('Programmes', 'La création du programme a échoué.');
      },
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.programForm.get(fieldName);

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
