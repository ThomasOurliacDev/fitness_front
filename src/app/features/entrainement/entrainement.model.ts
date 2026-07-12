// Modèles alignés sur le schéma Prisma du backend (fitness_back/prisma/schema.prisma).

/** Libellés français des groupes musculaires du dictionnaire (cf. seed du back). */
export const BODY_PART_LABELS: Record<string, string> = {
  CHEST: 'Pectoraux',
  BACK: 'Dos',
  TRAPS: 'Trapèzes',
  LOWER_BACK: 'Lombaires',
  SHOULDERS: 'Épaules',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  QUADS: 'Quadriceps',
  HAMSTRINGS: 'Ischio-jambiers',
  GLUTES: 'Fessiers',
  CALVES: 'Mollets',
  CORE: 'Abdominaux',
  CARDIO: 'Cardio',
  // Anciens groupes larges (conservés en fallback si d'anciennes données traînent)
  LEGS: 'Jambes',
  ARMS: 'Bras',
};

/** Libellé français d'un groupe musculaire (le code brut si inconnu). */
export function bodyPartLabel(bodyPart: string): string {
  return BODY_PART_LABELS[bodyPart] ?? bodyPart;
}

/** Famille (groupe primaire) de chaque groupe musculaire fin. */
export const PRIMARY_GROUPS: Record<string, string> = {
  CHEST: 'Pectoraux',
  BACK: 'Dos',
  TRAPS: 'Dos',
  LOWER_BACK: 'Dos',
  SHOULDERS: 'Épaules',
  BICEPS: 'Bras',
  TRICEPS: 'Bras',
  QUADS: 'Jambes',
  HAMSTRINGS: 'Jambes',
  GLUTES: 'Jambes',
  CALVES: 'Jambes',
  CORE: 'Abdominaux',
  CARDIO: 'Cardio',
  LEGS: 'Jambes',
  ARMS: 'Bras',
};

/** Ordre d'affichage des familles dans le dropdown (les inconnues passent à la fin). */
export const PRIMARY_GROUP_ORDER = ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Abdominaux', 'Cardio'];

/** Famille d'un groupe musculaire (son propre libellé si aucune famille connue). */
export function primaryGroupLabel(bodyPart: string): string {
  return PRIMARY_GROUPS[bodyPart] ?? bodyPartLabel(bodyPart);
}

/** Un exercice du dictionnaire global (ex: "Développé couché"). */
export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  bodyPart: string; // Ex: 'CHEST', 'BACK', 'LEGS'
  type: string;     // Ex: 'WEIGHTLIFTING', 'BODYWEIGHT', 'CARDIO'
  measure: 'REPS' | 'TIME'; // Comment se mesure une série : répétitions ou durée (gainage, cardio)
  weightIncrement: number;  // Progression : kg ajoutés au plafond de reps (2 pour les gros polyarticulaires)
}

/** Type de progression suggérée pour une série (surcharge progressive). */
export type Progression = 'REPS_UP' | 'WEIGHT_UP' | 'KEEP' | null;

/** Une série planifiée dans un template (objectif reps ou durée / poids / repos). */
export interface SetTemplate {
  id: string;
  workoutExerciseId: string;
  targetReps: number | null;     // exercices en 'REPS'
  targetDuration: number | null; // secondes, exercices en 'TIME'
  targetWeight: number | null;
  restTime: number; // secondes
  order: number;
  /**
   * Surcharge progressive — présents uniquement sur GET /workout-sessions/active :
   * objectif du jour calculé à partir de la dernière session terminée du même workout.
   */
  suggestedReps?: number | null;
  suggestedWeight?: number | null;
  progression?: Progression;
}

/** Le pont entre une séance type et un exercice du dictionnaire. */
export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  /** Progression : plafond de reps avant d'ajouter du poids (défaut 12). */
  maxReps?: number;
  /**
   * Présent sur GET /program/:id (complet) et GET /program (seul bodyPart est renvoyé
   * pour alléger la liste). Absent de la réponse du POST /workout-exercises.
   */
  exercise?: Pick<Exercise, 'bodyPart'> & Partial<Exercise>;
  /** Présent sur GET /program/:id uniquement. */
  sets?: SetTemplate[];
}

/** Une journée type d'un programme (ex: "Push Day"). */
export interface Workout {
  id: string;
  name: string;
  programId: string;
  /** Présent uniquement sur GET /program/:id (détail complet). */
  exercises?: WorkoutExercise[];
}

/** Un programme d'entraînement créé par l'utilisateur. */
export interface Program {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  /** Présent sur GET /program (liste) et GET /program/:id (détail). */
  workouts?: Workout[];
}

/** Payload de création d'un programme (le userId vient du token JWT). */
export interface CreateProgramPayload {
  name: string;
  description?: string;
}

/** Payload de création d'une séance dans un programme. */
export interface CreateWorkoutPayload {
  name: string;
  programId: string;
}

/** Une série planifiée à créer (restTime en secondes, order géré par le front). */
export interface CreateSetTemplatePayload {
  targetReps?: number;     // exercices en 'REPS'
  targetDuration?: number; // secondes, exercices en 'TIME'
  targetWeight?: number;
  restTime: number;
  order: number;
}

/** Payload pour ajouter un exercice (avec ses séries) à une séance. */
export interface CreateWorkoutExercisePayload {
  workoutId: string;
  exerciseId: string;
  order: number;
  maxReps?: number; // plafond de reps avant +poids (défaut 12 côté back)
  sets: CreateSetTemplatePayload[];
}

/** Payload d'édition d'un exercice de séance : les séries fournies REMPLACENT les existantes. */
export interface UpdateWorkoutExercisePayload {
  exerciseId?: string;
  maxReps?: number;
  sets?: CreateSetTemplatePayload[];
}

/** Payload de réordonnancement : tous les WorkoutExercise de la séance, dans le nouvel ordre. */
export interface ReorderWorkoutExercisesPayload {
  workoutId: string;
  orderedIds: string[];
}

// ==========================================
// EXÉCUTION (le tracking réel en salle)
// ==========================================

/** Une série réellement effectuée pendant une session. */
export interface LoggedSet {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  reps: number | null;
  duration: number | null; // secondes, exercices en 'TIME'
  weight: number | null;
  restTime: number;
  order: number;
  success: boolean; // la série a-t-elle été réussie (objectif atteint) ?
}

/** Une session d'entraînement (duration null = en cours). */
export interface WorkoutSession {
  id: string;
  date: string;
  userId: string;
  workoutId: string | null;
  duration: number | null;
  /** Présent sur GET /workout-sessions/active : le template complet de la séance. */
  workout?: Workout | null;
  /** Présent sur GET /workout-sessions/active : les séries déjà réalisées. */
  sets?: LoggedSet[];
}

/** Payload de log d'une série réalisée. */
export interface CreateSetPayload {
  workoutSessionId: string;
  exerciseId: string;
  reps?: number;
  duration?: number;
  weight?: number;
  restTime: number;
  order: number;
  success?: boolean;
}
