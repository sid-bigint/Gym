import { differenceInDays, parseISO } from 'date-fns';
import { MuscleData, MuscleGroup, RecoveryStatus } from '../store/useMuscleStore';

/**
 * Maps exercise names/categories to primary muscle groups
 * A single exercise can work multiple muscle groups
 */
const exerciseMuscleMap: Record<string, MuscleGroup[]> = {
    // Chest exercises
    'bench press': ['Chest'],
    'incline press': ['Chest', 'Shoulders'],
    'decline press': ['Chest'],
    'chest fly': ['Chest'],
    'push up': ['Chest', 'Triceps'],
    'dumbbell press': ['Chest', 'Shoulders'],

    // Back exercises
    'bent over row': ['Back', 'Biceps'],
    'pull up': ['Back', 'Biceps'],
    'lat pulldown': ['Back'],
    'cable row': ['Back', 'Biceps'],
    'deadlift': ['Back', 'Hamstrings', 'Glutes'],
    'shrug': ['Shoulders', 'Back'],

    // Shoulder exercises
    'shoulder press': ['Shoulders'],
    'lateral raise': ['Shoulders'],
    'front raise': ['Shoulders'],
    'dips': ['Triceps', 'Chest', 'Shoulders'],

    // Arm exercises
    'barbell curl': ['Biceps'],
    'dumbbell curl': ['Biceps'],
    'tricep extension': ['Triceps'],
    'tricep dip': ['Triceps'],
    'preacher curl': ['Biceps'],
    'overhead extension': ['Triceps'],
    'hammer curl': ['Biceps', 'Forearms'],

    // Leg exercises
    'squat': ['Quadriceps', 'Glutes', 'Hamstrings'],
    'leg press': ['Quadriceps', 'Glutes'],
    'leg curl': ['Hamstrings'],
    'leg extension': ['Quadriceps'],
    'lunge': ['Quadriceps', 'Glutes', 'Hamstrings'],
    'calf raise': ['Calves'],
    'hack squat': ['Quadriceps', 'Glutes'],

    // Core exercises
    'crunch': ['Abs', 'Core'],
    'sit-up': ['Abs', 'Core'],
    'plank': ['Core', 'Abs'],
    'ab crunch machine': ['Abs', 'Core'],
    'ab roller': ['Abs', 'Core'],
    'hanging leg raise': ['Abs', 'Core'],
    'cable crunch': ['Abs', 'Core'],
};

/**
 * Get muscle groups from exercise name or category
 */
export function getMuscleGroupsForExercise(exerciseName: string, category?: string): MuscleGroup[] {
    const searchText = `${exerciseName} ${category || ''}`.toLowerCase();

    // Direct match in map
    for (const [key, muscles] of Object.entries(exerciseMuscleMap)) {
        if (searchText.includes(key)) {
            return muscles;
        }
    }

    // Fallback: map category to muscle groups
    const categoryMap: Record<string, MuscleGroup[]> = {
        chest: ['Chest'],
        back: ['Back'],
        shoulders: ['Shoulders'],
        biceps: ['Biceps'],
        triceps: ['Triceps'],
        forearms: ['Forearms'],
        core: ['Core', 'Abs'],
        abs: ['Abs', 'Core'],
        quadriceps: ['Quadriceps'],
        hamstrings: ['Hamstrings'],
        glutes: ['Glutes'],
        calves: ['Calves'],
        legs: ['Quadriceps', 'Hamstrings', 'Glutes'],
    };

    if (category) {
        const key = category.toLowerCase();
        return categoryMap[key] || [];
    }

    // If exerciseName matches a category directly (used in placeholders)
    const exerciseKey = exerciseName.toLowerCase();
    if (categoryMap[exerciseKey]) {
        return categoryMap[exerciseKey];
    }

    return [];
}

/**
 * Calculate volume for a set (sets × reps × weight)
 */
export function calculateSetVolume(reps: number, weight: number, sets: number = 1): number {
    return reps * weight * sets;
}

/**
 * Determine recovery status based on soreness and days since training
 */
export function getRecoveryStatus(soreness: number, daysSinceTrained: number): RecoveryStatus {
    if (daysSinceTrained > 3) return 'FRESH';
    if (soreness > 6) return 'SORE';
    if (soreness > 3) return 'RECOVERING';
    if (daysSinceTrained === 0) return 'FATIGUED';
    return 'RECOVERING';
}

/**
 * Get color for muscle based on intensity and soreness
 */
export function getMuscleColorByStatus(intensity: number, soreness: number): string {
    // Soreness takes priority (red for sore)
    if (soreness > 6) return '#ef4444'; // Bright red
    if (soreness > 3) return '#f97316'; // Orange

    // Then intensity (purple/cyan)
    if (intensity > 7) return '#a855f7'; // Purple
    if (intensity > 4) return '#06b6d4'; // Cyan
    if (intensity > 0) return '#10b981'; // Green

    return '#64748b'; // Slate gray - no activity
}

/**
 * Build muscle data from workout sessions
 */
export interface WorkoutSetData {
    exerciseName: string;
    exerciseCategory?: string;
    reps: number;
    weight: number;
    date: string;
}

export function buildMuscleDataFromWorkouts(
    workoutSets: WorkoutSetData[],
    recoveryData?: Map<string, { soreness: number; lastTrainedDate: string }>
): Map<MuscleGroup, MuscleData> {
    const muscleMap = new Map<MuscleGroup, MuscleData>();
    const today = new Date().toISOString().split('T')[0];

    // Initialize all muscle groups
    const allMuscles: MuscleGroup[] = [
        'Chest',
        'Back',
        'Shoulders',
        'Biceps',
        'Triceps',
        'Forearms',
        'Core',
        'Abs',
        'Quadriceps',
        'Hamstrings',
        'Glutes',
        'Calves',
    ];

    for (const muscle of allMuscles) {
        muscleMap.set(muscle, {
            group: muscle,
            volume: 0,
            setCount: 0,
            repCount: 0,
            intensity: 0,
            soreness: 0,
            recoveryStatus: 'FRESH',
            lastTrainedDate: null,
            restDaysSince: 7,
            color: '#64748b',
        });
    }

    // Process workout sets
    const volumeByMuscle = new Map<MuscleGroup, number[]>();
    const setsByMuscle = new Map<MuscleGroup, number>();

    for (const set of workoutSets) {
        const muscles = getMuscleGroupsForExercise(set.exerciseName, set.exerciseCategory);
        const volume = calculateSetVolume(set.reps, set.weight);

        for (const muscle of muscles) {
            const existing = muscleMap.get(muscle)!;
            existing.volume += volume;
            existing.setCount += 1;
            existing.repCount += set.reps;
            existing.lastTrainedDate = set.date;

            // Track volumes for averaging
            if (!volumeByMuscle.has(muscle)) {
                volumeByMuscle.set(muscle, []);
            }
            volumeByMuscle.get(muscle)!.push(volume);
        }
    }

    // Calculate intensity as average volume per set
    for (const [muscle, volumes] of volumeByMuscle.entries()) {
        if (volumes.length > 0) {
            const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
            // Normalize to 1-10 scale
            const intensity = Math.min(10, Math.max(1, avgVolume / 50));
            muscleMap.get(muscle)!.intensity = intensity;
        }
    }

    // Apply recovery data if provided
    if (recoveryData) {
        for (const [muscle, data] of recoveryData.entries()) {
            const muscleKey = muscle as MuscleGroup;
            const existing = muscleMap.get(muscleKey);
            if (existing) {
                existing.soreness = data.soreness;
                if (data.lastTrainedDate) {
                    const daysSince = differenceInDays(parseISO(today), parseISO(data.lastTrainedDate));
                    existing.restDaysSince = Math.max(0, daysSince);
                    existing.recoveryStatus = getRecoveryStatus(data.soreness, daysSince);
                }
            }
        }
    }

    // Update colors
    for (const muscle of muscleMap.values()) {
        muscle.color = getMuscleColorByStatus(muscle.intensity, muscle.soreness);
    }

    return muscleMap;
}

/**
 * Calculate weekly volume data for a muscle group
 */
export function calculateWeeklyData(
    workoutSets: Array<WorkoutSetData & { volumePerExercise: number }>,
    muscleGroup: MuscleGroup
): number[] {
    const weeklyVolume = Array(7).fill(0);
    const today = new Date();

    for (const set of workoutSets) {
        const setDate = parseISO(set.date);
        if (differenceInDays(today, setDate) < 7) {
            const dayIndex = differenceInDays(today, setDate);
            const muscles = getMuscleGroupsForExercise(set.exerciseName, set.exerciseCategory);
            if (muscles.includes(muscleGroup)) {
                weeklyVolume[dayIndex] += set.volumePerExercise;
            }
        }
    }

    return weeklyVolume.reverse(); // Return oldest to newest
}
