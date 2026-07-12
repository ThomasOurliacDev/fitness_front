import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
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
    DialogModule,
    InputTextModule,
    TextareaModule,
    FloatLabelModule,
    SkeletonModule,
    TagModule,
    ReactiveFormsModule,
    DatePipe,
  ],
  templateUrl: './program.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './program.component.scss',
})
export class ProgramComponent implements OnInit {

  readonly entrainementService = inject(EntrainementService);
  private readonly toaster = inject(ToasterService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly programs = signal<Program[]>([]);
  readonly loading = signal(true);

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
