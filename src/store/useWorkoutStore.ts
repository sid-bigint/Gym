import { create } from 'zustand';
import { Routine, RoutineExercise, Exercise, WorkoutLog, WorkoutSet, ActiveWorkoutSession, ActiveSet } from '../types';
import { getDatabase } from '../db/database';

interface WorkoutState {
    routines: Routine[];
    exercises: Exercise[];
    history: WorkoutLog[];
    isLoading: boolean;
    activeWorkout: ActiveWorkoutSession | null;

    loadRoutines: () => Promise<void>;
    loadExercises: () => Promise<void>;
    loadHistory: (limit?: number) => Promise<void>;
    addExercise: (exercise: { name: string; muscleGroup: string; type?: string; instructions?: string[]; images?: string[] }) => Promise<Exercise>;
    createRoutine: (name: string, exercises: { exerciseId: number; sets: number; reps: number }[], programId?: string) => Promise<void>;
    updateRoutine: (id: number, name: string, exercises: { exerciseId: number; sets: number; reps: number }[]) => Promise<void>;
    deleteRoutine: (id: number) => Promise<void>;

    saveWorkoutLog: (routineId: number | null, routineName: string, duration: number, notes: string, sets: any[]) => Promise<number>;
    getLastWorkoutLog: (routineId: number) => Promise<WorkoutLog | null>;

    // Active Workout Actions
    startWorkout: (routineId: number | null) => Promise<void>;
    updateActiveSet: (index: number, field: 'weight' | 'reps' | 'type', value: string) => void;
    toggleActiveSet: (index: number) => void;
    addActiveSet: (exerciseId: number, exerciseName: string) => void;
    removeActiveSet: (index: number) => void;
    finishActiveWorkout: (notes?: string) => Promise<number | null>;
    cancelActiveWorkout: () => void;
    getWorkoutHistory: (limit?: number) => Promise<any[]>;
    getExerciseHistory: (exerciseId: number) => Promise<any[]>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    routines: [],
    exercises: [],
    history: [],
    isLoading: false,
    activeWorkout: null,

    // ... (keep loadExercises, addExercise, loadRoutines, createRoutine, deleteRoutine same)
    loadExercises: async () => {
        try {
            const db = await getDatabase();
            const results = await db.getAllAsync<any>('SELECT * FROM exercises ORDER BY name ASC', []);

            const parsedExercises: Exercise[] = results.map(ex => {
                let instructions: string[] = [];
                let images: string[] = [];
                try {
                    if (ex.instructions) instructions = JSON.parse(ex.instructions);
                    if (ex.images) images = JSON.parse(ex.images);
                } catch (parseError) {
                    console.warn("Failed to parse JSON for exercise", ex.id);
                }
                return {
                    id: ex.id,
                    name: ex.name,
                    muscleGroup: ex.muscle_group,
                    type: ex.type,
                    isCustom: !!ex.is_custom,
                    instructions: instructions,
                    images: images
                };
            });

            set({ exercises: parsedExercises });
        } catch (e) {
            console.error("Failed to load exercises", e);
        }
    },

    addExercise: async (exercise) => {
        try {
            const db = await getDatabase();

            const instructionsJson = exercise.instructions ? JSON.stringify(exercise.instructions) : null;
            const imagesJson = exercise.images ? JSON.stringify(exercise.images) : null;

            const result = await db.runAsync(
                'INSERT INTO exercises (name, muscle_group, type, instructions, images) VALUES (?, ?, ?, ?, ?)',
                [exercise.name, exercise.muscleGroup, exercise.type || 'General', instructionsJson, imagesJson]
            );
            const newEx: Exercise = {
                id: result.lastInsertRowId,
                name: exercise.name,
                muscleGroup: exercise.muscleGroup,
                type: exercise.type || 'General',
                isCustom: true,
                instructions: exercise.instructions || [],
                images: exercise.images || []
            };
            set(state => ({ exercises: [...state.exercises, newEx] }));
            return newEx;
        } catch (e) {
            console.error("Failed to add exercise", e);
            throw e;
        }
    },

    loadRoutines: async () => {
        set({ isLoading: true });
        try {
            const { useUserStore } = require('./useUserStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id;

            if (!userId) {
                set({ routines: [], isLoading: false });
                return;
            }

            const db = await getDatabase();
            const routines = await db.getAllAsync<Routine>('SELECT * FROM routines WHERE user_id = ? OR program_id IS NOT NULL', [userId]);

            // Load exercises for each routine
            const routinesWithExercises = await Promise.all(routines.map(async (routine) => {
                const routineExercises = await db.getAllAsync<any>(
                    `SELECT re.*, e.name, e.muscle_group, e.type, e.instructions, e.images
           FROM routine_exercises re 
           JOIN exercises e ON re.exercise_id = e.id 
           WHERE re.routine_id = ? 
           ORDER BY re.order_index ASC`,
                    [routine.id]
                );

                return {
                    ...routine,
                    exercises: routineExercises.map(re => {
                        let instructions: string[] = [];
                        let images: string[] = [];
                        try {
                            if (re.instructions) instructions = JSON.parse(re.instructions);
                            if (re.images) images = JSON.parse(re.images);
                        } catch (e) { }

                        return {
                            id: re.id,
                            exerciseId: re.exercise_id,
                            sets: re.sets || 3,
                            reps: re.reps || 10,
                            exercise: {
                                id: re.exercise_id,
                                name: re.name,
                                muscleGroup: re.muscle_group,
                                type: re.type,
                                isCustom: false,
                                instructions: instructions,
                                images: images
                            }
                        };
                    })
                };
            }));

            set({
                routines: routinesWithExercises.map(r => ({
                    ...r,
                    // Map snake_case DB column to camelCase property if needed, 
                    // though if we typed it as any it's fine, but let's be safe
                    programId: (r as any).program_id
                }))
            });
        } catch (e) {
            console.error("Failed to load routines", e);
        } finally {
            set({ isLoading: false });
        }
    },

    createRoutine: async (name, exerciseList, programId) => {
        try {
            const db = await getDatabase();
            const safeName = String(name || "New Routine");
            const safeProgramId = programId || null;

            const { useUserStore } = require('./useUserStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id;

            if (!userId) {
                console.error("No user ID found for creating routine");
                return;
            }

            console.log("Creating routine:", safeName, "for program:", safeProgramId);
            const result = await db.runAsync('INSERT INTO routines (name, program_id, user_id) VALUES (?, ?, ?)', [safeName, safeProgramId, userId]);
            const routineId = result.lastInsertRowId;

            if (!routineId) {
                console.error("Failed to get routine ID after insert.");
                return;
            }

            for (let i = 0; i < exerciseList.length; i++) {
                const item = exerciseList[i];
                // Ensure explicit numbers, no NaNs
                const exerciseId = parseInt(String(item.exerciseId), 10);
                const sets = parseInt(String(item.sets), 10) || 3;
                const reps = parseInt(String(item.reps), 10) || 10;

                if (isNaN(exerciseId)) {
                    console.warn(`Skipping invalid exercise ID at index ${i} for routine ${routineId}:`, item);
                    continue;
                }

                console.log(`Inserting routine_exercise for routine ${routineId}: exerciseId=${exerciseId}, order_index=${i}, sets=${sets}, reps=${reps}`);
                await db.runAsync(
                    `INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps) VALUES (?, ?, ?, ?, ?)`,
                    [routineId, exerciseId, i, sets, reps]
                );
            }
            await get().loadRoutines();
        } catch (e) {
            console.error("Failed to create routine", e);
        }
    },

    updateRoutine: async (id, name, exerciseList) => {
        try {
            const db = await getDatabase();
            const safeId = parseInt(String(id), 10);
            const safeName = String(name || "Routine");

            if (isNaN(safeId)) {
                console.error("Invalid routine ID for update:", id);
                return;
            }

            await db.runAsync('UPDATE routines SET name = ? WHERE id = ?', [safeName, safeId]);
            await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', [safeId]);

            for (let i = 0; i < exerciseList.length; i++) {
                const item = exerciseList[i];
                const exerciseId = parseInt(String(item.exerciseId), 10);
                const sets = parseInt(String(item.sets), 10) || 3;
                const reps = parseInt(String(item.reps), 10) || 10;

                if (isNaN(exerciseId)) {
                    console.warn(`Skipping invalid exercise ID at index ${i} for routine ${safeId}:`, item);
                    continue;
                }

                console.log(`Inserting routine_exercise for routine ${safeId}: exerciseId=${exerciseId}, order_index=${i}, sets=${sets}, reps=${reps}`);
                await db.runAsync(
                    `INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps) VALUES (?, ?, ?, ?, ?)`,
                    [safeId, exerciseId, i, sets, reps]
                );
            }
            await get().loadRoutines();
        } catch (e) {
            console.error("Failed to update routine", e);
        }
    },

    deleteRoutine: async (id) => {
        try {
            const db = await getDatabase();
            const safeId = Number(id);

            // Delete dependencies first
            await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', [safeId]);

            // Unlink workouts (keep the history, just remove the routine link)
            await db.runAsync('UPDATE workouts SET routine_id = NULL WHERE routine_id = ?', [safeId]);

            // Now delete the routine
            await db.runAsync('DELETE FROM routines WHERE id = ?', [safeId]);

            await get().loadRoutines();
        } catch (e) {
            console.error("Failed to delete routine", e);
            throw e;
        }
    },

    saveWorkoutLog: async (routineId: number | null, routineName: string, duration: number, notes: string, sets: any[]) => {
        try {
            const db = await getDatabase();
            let workoutId = 0;

            // Temporarily disable FK constraints to avoid issues with stale IDs
            await db.execAsync('PRAGMA foreign_keys = OFF;');

            try {
                // Sanitize inputs
                let safeRoutineId: number | null = null;
                if (routineId !== undefined && routineId !== null) {
                    const rid = Number(routineId);
                    if (!isNaN(rid) && rid > 0) {
                        // Verify routine exists
                        const routineExists = await db.getFirstAsync<{ count: number }>(
                            'SELECT COUNT(*) as count FROM routines WHERE id = ?',
                            [rid]
                        );
                        if (routineExists && routineExists.count > 0) {
                            safeRoutineId = rid;
                        }
                    }
                }

                const safeDuration = Math.floor(Number(duration) / 60) || 0;
                const safeNotes = notes ? String(notes) : '';
                const safeDate = new Date().toISOString();
                const safeRoutineName = routineName?.trim() || 'Quick Workout';

                const { useUserStore } = require('./useUserStore');
                const userStore = useUserStore.getState();
                const userId = userStore.user?.id;

                console.log("Saving workout:", { safeRoutineName, safeRoutineId, safeDuration, setsCount: sets.length, userId });

                // Insert into workouts table
                const result = await db.runAsync(
                    'INSERT INTO workouts (routine_id, routine_name, duration_minutes, notes, date, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [safeRoutineId, safeRoutineName, safeDuration, safeNotes, safeDate, userId || null]
                );
                workoutId = result.lastInsertRowId;
                console.log("Workout saved, workoutId:", workoutId);

                // Insert sets into workout_sets table
                for (let i = 0; i < sets.length; i++) {
                    const setData = sets[i];
                    const safeExerciseId = Number(setData.exerciseId);
                    const safeWeight = isNaN(Number(setData.weight)) ? 0 : Number(setData.weight);
                    const safeReps = isNaN(Number(setData.reps)) ? 0 : Number(setData.reps);
                    const exerciseName = setData.exerciseName || '';
                    const setType = setData.type || 'Normal';

                    // Skip invalid exercise IDs
                    if (!safeExerciseId || isNaN(safeExerciseId) || safeExerciseId <= 0) {
                        console.warn(`Skipping set with invalid exerciseId: ${setData.exerciseId}`);
                        continue;
                    }

                    console.log(`Inserting set ${i + 1}: exercise=${safeExerciseId}, weight=${safeWeight}, reps=${safeReps}, type=${setType}`);

                    await db.runAsync(
                        `INSERT INTO workout_sets (workout_id, exercise_id, exercise_name, set_number, weight, reps, completed, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [workoutId, safeExerciseId, exerciseName, i + 1, safeWeight, safeReps, 1, setType]
                    );
                }

                console.log("Workout log saved successfully");

            } finally {
                // Re-enable FK constraints
                await db.execAsync('PRAGMA foreign_keys = ON;');
            }
            return workoutId;
        } catch (e) {
            console.error("Failed to save workout log", e);
            throw e;
        }
    },

    getLastWorkoutLog: async (routineId: number) => {
        try {
            const db = await getDatabase();

            const safeRoutineId = Number(routineId);
            if (isNaN(safeRoutineId)) return null;

            // Query workouts table (not workout_logs)
            // We can relax user_id check here if we assume routine_id is already validated,
            // but safer to include it if possible, though routine_id implies ownership usually.
            const logs = await db.getAllAsync<any>(
                'SELECT * FROM workouts WHERE routine_id = ? ORDER BY date DESC LIMIT 1',
                [safeRoutineId]
            );

            const log = logs.length > 0 ? logs[0] : null;

            if (!log) return null;

            const safeLogId = Number(log.id);
            // Query workout_sets with workout_id (not workout_log_id)
            const sets = await db.getAllAsync<any>(
                'SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY id ASC',
                [safeLogId]
            );

            return {
                id: log.id,
                routineId: log.routine_id,
                date: log.date,
                durationSeconds: (log.duration_minutes || 0) * 60,
                notes: log.notes,
                sets: sets.map(s => ({
                    id: s.id,
                    exerciseId: s.exercise_id,
                    weight: s.weight,
                    reps: s.reps,
                    setNumber: s.set_number,
                    type: s.type || 'Normal'
                }))
            } as WorkoutLog;
        } catch (e) {
            console.error("Failed to get last workout log", e);
            return null;
        }
    },

    startWorkout: async (routineId) => {
        const { routines, getLastWorkoutLog } = get();
        let activeSets: ActiveSet[] = [];
        let routineName = 'Quick Workout';

        if (routineId) {
            const found = routines.find(r => r.id === routineId);
            if (found) {
                routineName = found.name;

                // Pre-fill Logic
                let lastSets: WorkoutSet[] = [];
                const lastLog = await getLastWorkoutLog(found.id);
                if (lastLog && lastLog.sets) {
                    lastSets = lastLog.sets;
                }

                if (found.exercises) {
                    found.exercises.forEach(re => {
                        const prevSetsForEx = lastSets.filter(ls => ls.exerciseId === re.exerciseId);

                        for (let i = 0; i < (re.sets || 3); i++) {
                            const prevSet = prevSetsForEx[i] || (prevSetsForEx.length > 0 ? prevSetsForEx[prevSetsForEx.length - 1] : null);
                            const prevWeight = prevSet ? String(prevSet.weight) : '';
                            const prevReps = prevSet ? String(prevSet.reps) : String(re.reps || 10);

                            activeSets.push({
                                exerciseId: re.exerciseId,
                                setNumber: i + 1,
                                weight: prevWeight,
                                reps: prevReps,
                                completed: false,
                                exerciseName: re.exercise.name,
                                exerciseImage: re.exercise.images?.[0] || null,
                                type: 'Normal'
                            });
                        }
                    });
                }
            }
        }

        set({
            activeWorkout: {
                startTime: Date.now(),
                routineId: routineId,
                routineName: routineName,
                activeSets: activeSets,
                isRunning: true
            }
        });
    },

    updateActiveSet: (index, field, value) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const newSets = [...activeWorkout.activeSets];
        newSets[index] = { ...newSets[index], [field]: value };

        set({
            activeWorkout: {
                ...activeWorkout,
                activeSets: newSets
            }
        });
    },

    toggleActiveSet: (index) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const newSets = [...activeWorkout.activeSets];
        newSets[index].completed = !newSets[index].completed;

        set({
            activeWorkout: {
                ...activeWorkout,
                activeSets: newSets
            }
        });
    },

    addActiveSet: (exerciseId, exerciseName) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const sets = [...activeWorkout.activeSets];

        // Find the last index of this exercise
        let lastIndex = -1;
        let lastSetNumber = 0;

        for (let i = sets.length - 1; i >= 0; i--) {
            if (sets[i].exerciseId === exerciseId) {
                lastIndex = i;
                lastSetNumber = sets[i].setNumber;
                break;
            }
        }

        // Create new set
        const newSet: ActiveSet = {
            exerciseId,
            exerciseName,
            setNumber: lastSetNumber + 1,
            weight: lastIndex >= 0 ? sets[lastIndex].weight : '0', // Copy previous weight
            reps: lastIndex >= 0 ? sets[lastIndex].reps : '10', // Copy previous reps
            completed: false,
            type: 'Normal'
        };

        if (lastIndex >= 0) {
            sets.splice(lastIndex + 1, 0, newSet);
        } else {
            sets.push(newSet); // Should not happen if exercise exists
        }

        set({
            activeWorkout: {
                ...activeWorkout,
                activeSets: sets
            }
        });
    },

    removeActiveSet: (index) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const setToRemove = activeWorkout.activeSets[index];
        const sets = activeWorkout.activeSets.filter((_, i) => i !== index);

        // Re-number sets for this exercise
        let currentSetNum = 1;
        const updatedSets = sets.map(s => {
            if (s.exerciseId === setToRemove.exerciseId) {
                return { ...s, setNumber: currentSetNum++ };
            }
            return s;
        });

        set({
            activeWorkout: {
                ...activeWorkout,
                activeSets: updatedSets
            }
        });
    },

    finishActiveWorkout: async (notes = '') => {
        const { activeWorkout, saveWorkoutLog } = get();
        if (!activeWorkout) return null;

        const duration = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
        const completedSets = activeWorkout.activeSets.filter(s => s.completed);

        // Calculate Stats
        // ... (volume, etc can be done here or in UI)

        const workoutId = await saveWorkoutLog(
            activeWorkout.routineId,
            activeWorkout.routineName,
            duration,
            notes,
            completedSets.map(s => ({
                exerciseId: s.exerciseId,
                exerciseName: s.exerciseName,
                weight: Number(s.weight) || 0,
                reps: Number(s.reps) || 0,
                type: s.type || 'Normal'
            }))
        );

        set({ activeWorkout: null });
        return workoutId;
    },

    cancelActiveWorkout: () => {
        set({ activeWorkout: null });
    },

    getWorkoutHistory: async (limit = 10) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id;

            if (!userId) return [];

            const db = await getDatabase();
            const logs = await db.getAllAsync<any>(
                'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT ?',
                [userId, limit]
            );

            // Enrich with summary data
            const enrichedLogs = await Promise.all(logs.map(async (log) => {
                const sets = await db.getAllAsync<any>(
                    'SELECT * FROM workout_sets WHERE workout_id = ?',
                    [log.id]
                );

                const volume = sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
                const exercises = [...new Set(sets.map(s => s.exercise_name))];

                return {
                    id: log.id,
                    date: log.date,
                    duration: log.duration_minutes,
                    routineName: log.routine_name,
                    volume,
                    exercises,
                    setsCount: sets.length
                };
            }));

            return enrichedLogs;
        } catch (e) {
            console.error("Failed to get history", e);
            return [];
        }
    },

    loadHistory: async (limit = 10) => {
        const history = await get().getWorkoutHistory(limit);
        set({ history });
    },

    getExerciseHistory: async (exerciseId: number) => {
        try {
            const db = await getDatabase();
            const sets = await db.getAllAsync<any>(
                `SELECT ws.*, w.date 
                 FROM workout_sets ws
                 JOIN workouts w ON ws.workout_id = w.id
                 WHERE ws.exercise_id = ? 
                 ORDER BY w.date ASC`,
                [exerciseId]
            );
            return sets;
        } catch (e) {
            console.error("Failed to get exercise history", e);
            return [];
        }
    },
}));
