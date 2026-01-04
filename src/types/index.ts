export interface UserProfile {
    id?: number;
    name: string;
    gender: 'male' | 'female';
    age: number;
    height: number; // cm
    weight: number; // kg
    activityLevel: ActivityLevel;
    goal: FitnessGoal;
    calorieGoal: number;
    targetWeight?: number;
    targetProtein: number;
    targetCarbs: number;
    targetFats: number;
    picture?: string | null;
}

export type ActivityLevel =
    | 'sedentary' // 1.2
    | 'light'     // 1.375
    | 'moderate'  // 1.55
    | 'active'    // 1.725
    | 'very_active'; // 1.9

export type FitnessGoal = 'cut' | 'bulk' | 'maintain';

export interface Exercise {
    id: number;
    name: string;
    muscleGroup: string;
    type: string;
    instructions?: string[];
    images?: string[];
    isCustom: boolean;
}

export interface Routine {
    id: number;
    name: string;
    programId?: string;
    description?: string;
    exercises: RoutineExercise[];
}

export interface RoutineExercise {
    id: number;
    exerciseId: number;
    exercise: Exercise;
    sets: number; // Target sets
    reps: number; // Target reps
}

export interface WorkoutLog {
    id: number;
    routineId: number | null;
    routineName?: string;
    date: string;
    durationSeconds?: number;
    duration?: number; // duration in minutes (enriched)
    volume?: number;   // total volume (enriched)
    exercises?: string[]; // exercise names (enriched)
    setsCount?: number;   // total sets (enriched)
    sets: WorkoutSet[];
}

export interface WorkoutSet {
    id: number;
    exerciseId: number;
    weight: number;
    reps: number;
    rpe?: number;
    type?: string; // 'Normal', 'Warmup', 'Drop', 'Super', 'Failure'
}

export interface ActiveSet {
    exerciseId: number;
    setNumber: number;
    weight: string;
    reps: string;
    completed: boolean;
    exerciseName?: string;
    exerciseImage?: string | null;
    type: string; // 'Normal', 'Warmup', 'Drop', 'Super', 'Failure'
}

export interface ActiveWorkoutSession {
    startTime: number; // timestamp
    routineId: number | null;
    routineName: string;
    activeSets: ActiveSet[];
    isRunning: boolean;
}
