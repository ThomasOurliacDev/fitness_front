import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import {
  CreateProgramPayload,
  CreateSetPayload,
  CreateWorkoutExercisePayload,
  CreateWorkoutPayload,
  Exercise,
  ExerciseProgress,
  HistorySession,
  LoggedExercise,
  LoggedSet,
  Program,
  ReorderWorkoutExercisesPayload,
  SessionStats,
  UpdateWorkoutExercisePayload,
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from './entrainement.model';
import { ApiEnvelope } from '../../core/api/api-envelope';


@Injectable({
  providedIn: 'root',
})
export class EntrainementService {
  protected apiUrl = environment.apiUrl;
  httpClient = inject(HttpClient);

  /** Liste des programmes de l'utilisateur connecté (avec leurs workouts). */
  getPrograms() {
    return this.httpClient
      .get<ApiEnvelope<Program[]>>(`${this.apiUrl}/program`)
      .pipe(map((res) => res.data));
  }

  /** Détail complet d'un programme : workouts → exercices → séries planifiées. */
  getProgram(id: string) {
    return this.httpClient
      .get<ApiEnvelope<Program>>(`${this.apiUrl}/program/${id}`)
      .pipe(map((res) => res.data));
  }

  /** Crée un programme pour l'utilisateur connecté (identifié par son token). */
  createProgram(payload: CreateProgramPayload) {
    return this.httpClient
      .post<ApiEnvelope<Program>>(`${this.apiUrl}/program`, payload)
      .pipe(map((res) => res.data));
  }

  /** Supprime un programme entier (séances/exercices en cascade, historique conservé). */
  deleteProgram(id: string) {
    return this.httpClient
      .delete<ApiEnvelope<{ id: string }>>(`${this.apiUrl}/program/${id}`)
      .pipe(map((res) => res.data));
  }

  /** Supprime une séance planifiée entière (exercices en cascade, historique conservé). */
  deleteWorkout(id: string) {
    return this.httpClient
      .delete<ApiEnvelope<{ id: string }>>(`${this.apiUrl}/workouts/${id}`)
      .pipe(map((res) => res.data));
  }

  /** Le dictionnaire global des exercices (Développé couché, Squat...). */
  getExercises() {
    return this.httpClient
      .get<ApiEnvelope<Exercise[]>>(`${this.apiUrl}/exercises`)
      .pipe(map((res) => res.data));
  }

  /** Ajoute une séance (ex: "Push Day") à un programme. */
  createWorkout(payload: CreateWorkoutPayload) {
    return this.httpClient
      .post<ApiEnvelope<Workout>>(`${this.apiUrl}/workouts`, payload)
      .pipe(map((res) => res.data));
  }

  /** Ajoute un exercice avec ses séries planifiées à une séance. */
  addExerciseToWorkout(payload: CreateWorkoutExercisePayload) {
    return this.httpClient
      .post<ApiEnvelope<WorkoutExercise>>(`${this.apiUrl}/workout-exercises`, payload)
      .pipe(map((res) => res.data));
  }

  /** Modifie un exercice de séance (exercice et/ou séries, qui remplacent les existantes). */
  updateWorkoutExercise(id: string, payload: UpdateWorkoutExercisePayload) {
    return this.httpClient
      .patch<ApiEnvelope<WorkoutExercise>>(`${this.apiUrl}/workout-exercises/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  /** Supprime un exercice d'une séance (ses séries planifiées partent avec). */
  deleteWorkoutExercise(id: string) {
    return this.httpClient
      .delete<ApiEnvelope<{ id: string }>>(`${this.apiUrl}/workout-exercises/${id}`)
      .pipe(map((res) => res.data));
  }

  /** Réordonne les exercices d'une séance. */
  reorderWorkoutExercises(payload: ReorderWorkoutExercisesPayload) {
    return this.httpClient
      .patch<ApiEnvelope<ReorderWorkoutExercisesPayload>>(`${this.apiUrl}/workout-exercises/reorder`, payload)
      .pipe(map((res) => res.data));
  }

  // --- Exécution (sessions) ---

  /** Démarre une session d'entraînement basée sur une séance planifiée. */
  startSession(workoutId: string) {
    return this.httpClient
      .post<ApiEnvelope<WorkoutSession>>(`${this.apiUrl}/workout-sessions/start`, { workoutId })
      .pipe(map((res) => res.data));
  }

  /** La session en cours (avec le template de la séance et les séries déjà loggées), ou null. */
  getActiveSession() {
    return this.httpClient
      .get<ApiEnvelope<WorkoutSession | null>>(`${this.apiUrl}/workout-sessions/active`)
      .pipe(map((res) => res.data));
  }

  /** Termine la session : la durée est calculée côté serveur. */
  finishSession(sessionId: string) {
    return this.httpClient
      .patch<ApiEnvelope<WorkoutSession>>(`${this.apiUrl}/workout-sessions/${sessionId}/finish`, {})
      .pipe(map((res) => res.data));
  }

  /** Enregistre une série réellement effectuée dans la session en cours. */
  logSet(payload: CreateSetPayload) {
    return this.httpClient
      .post<ApiEnvelope<LoggedSet>>(`${this.apiUrl}/sets`, payload)
      .pipe(map((res) => res.data));
  }

  // --- Historique & activité ---

  /** Les séances terminées, les plus récentes en premier (jusqu'à 100). */
  getHistory() {
    return this.httpClient
      .get<ApiEnvelope<HistorySession[]>>(`${this.apiUrl}/workout-sessions/history`)
      .pipe(map((res) => res.data));
  }

  /** Statistiques agrégées : totaux, tendance récente, répartition par groupe musculaire. */
  getStats() {
    return this.httpClient
      .get<ApiEnvelope<SessionStats>>(`${this.apiUrl}/workout-sessions/stats`)
      .pipe(map((res) => res.data));
  }

  /** Les exercices déjà réalisés au moins une fois, pour peupler le sélecteur du graphique. */
  getLoggedExercises() {
    return this.httpClient
      .get<ApiEnvelope<LoggedExercise[]>>(`${this.apiUrl}/workout-sessions/logged-exercises`)
      .pipe(map((res) => res.data));
  }

  /** L'historique de performance (une entrée par séance terminée) des exercices demandés. */
  getExerciseProgress(exerciseIds: string[]) {
    return this.httpClient
      .get<ApiEnvelope<ExerciseProgress[]>>(`${this.apiUrl}/workout-sessions/exercise-progress`, {
        params: { exerciseIds: exerciseIds.join(',') },
      })
      .pipe(map((res) => res.data));
  }
}
