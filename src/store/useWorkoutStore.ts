import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { CloudSyncService } from '../services/cloudSyncService';
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { ActiveSet, ActiveWorkoutSession, Exercise, Routine, WorkoutLog, WorkoutSet, WorkoutStreak } from '../types';

const DEFAULT_STREAK: WorkoutStreak = {
    current: 0,
    longest: 0,
    workoutsThisWeek: 0,
    workoutsThisMonth: 0,
    lastWorkoutDate: null,
    activeDays: [],
    todayCompleted: false,
};

function toDayKey(dateInput: string | Date) {
    return format(new Date(dateInput), 'yyyy-MM-dd');
}

function differenceInCalendarDaysSafe(later: Date, earlier: Date) {
    const safeLater = new Date(later.getFullYear(), later.getMonth(), later.getDate());
    const safeEarlier = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
    return Math.round((safeLater.getTime() - safeEarlier.getTime()) / 86400000);
}

function buildStreakStats(dates: string[]): WorkoutStreak {
    if (dates.length === 0) {
        return DEFAULT_STREAK;
    }

    const uniqueDays = Array.from(new Set(dates.map(toDayKey))).sort((a, b) => b.localeCompare(a));
    const today = new Date();
    const todayKey = toDayKey(today);
    const yesterday = subDays(today, 1);
    const yesterdayKey = toDayKey(yesterday);
    const parsedDays = uniqueDays.map((day) => new Date(`${day}T00:00:00`));
    const lastWorkoutDate = uniqueDays[0];
    const todayCompleted = uniqueDays.includes(todayKey);

    let current = 0;
    if (lastWorkoutDate === todayKey || lastWorkoutDate === yesterdayKey) {
        current = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
            const previous = new Date(`${uniqueDays[i - 1]}T00:00:00`);
            const next = new Date(`${uniqueDays[i]}T00:00:00`);
            if (differenceInCalendarDaysSafe(previous, next) === 1) {
                current += 1;
            } else {
                break;
            }
        }
    }

    let longest = uniqueDays.length > 0 ? 1 : 0;
    let running = uniqueDays.length > 0 ? 1 : 0;
    for (let i = 1; i < uniqueDays.length; i++) {
        const previous = new Date(`${uniqueDays[i - 1]}T00:00:00`);
        const next = new Date(`${uniqueDays[i]}T00:00:00`);
        if (differenceInCalendarDaysSafe(previous, next) === 1) {
            running += 1;
        } else {
            longest = Math.max(longest, running);
            running = 1;
        }
    }
    longest = Math.max(longest, running);

    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    return {
        current,
        longest,
        workoutsThisWeek: parsedDays.filter((day) => day >= weekStart && day <= weekEnd).length,
        workoutsThisMonth: parsedDays.filter((day) => day >= monthStart && day <= monthEnd).length,
        lastWorkoutDate,
        activeDays: uniqueDays,
        todayCompleted,
    };
}

interface WorkoutState {
    routines: Routine[];
    exercises: Exercise[];
    history: WorkoutLog[];
    streak: WorkoutStreak;
    isLoading: boolean;
    activeWorkout: ActiveWorkoutSession | null;

    loadRoutines: () => Promise<void>;
    loadExercises: () => Promise<void>;
    loadHistory: (limit?: number) => Promise<void>;
    addExercise: (exercise: { name: string; muscleGroup: string; type?: string; instructions?: string[]; images?: string[] }) => Promise<Exercise>;
    createRoutine: (name: string, exercises: { exerciseId: number; sets: number; reps: number }[], programId?: string) => Promise<void>;
    updateRoutine: (id: number, name: string, exercises: { exerciseId: number; sets: number; reps: number }[]) => Promise<void>;
    deleteRoutine: (id: number) => Promise<void>;
    deleteExercise: (id: number) => Promise<void>;

    saveWorkoutLog: (routineId: number | null, routineName: string, duration: number, notes: string, sets: any[]) => Promise<number>;
    deleteWorkoutLog: (id: number) => Promise<void>;
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
    loadStreak: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    routines: [],
    exercises: [],
    history: [],
    streak: DEFAULT_STREAK,
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

            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id || null;

            const result = await db.runAsync(
                'INSERT INTO exercises (name, muscle_group, type, is_custom, instructions, images, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [exercise.name, exercise.muscleGroup, exercise.type || 'General', 1, instructionsJson, imagesJson, userId]
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
            CloudSyncService.scheduleBackup('exercise-created');
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

            // Load exercises sequentially. Android expo-sqlite can release prepared
            // statement handles too early when several queries run in parallel.
            const routinesWithExercises: Routine[] = [];
            for (const routine of routines) {
                const routineExercises = await db.getAllAsync<any>(
                    `SELECT re.*, e.name, e.muscle_group, e.type, e.instructions, e.images
           FROM routine_exercises re 
           JOIN exercises e ON re.exercise_id = e.id 
           WHERE re.routine_id = ? 
           ORDER BY re.order_index ASC`,
                    [routine.id]
                );

                const routineWithExercises = {
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
                routinesWithExercises.push(routineWithExercises);
            }

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
            CloudSyncService.scheduleBackup('routine-created');
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
            CloudSyncService.scheduleBackup('routine-updated');
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
            CloudSyncService.scheduleBackup('routine-deleted');
        } catch (e) {
            console.error("Failed to delete routine", e);
            throw e;
        }
    },

    deleteExercise: async (id) => {
        try {
            const db = await getDatabase();
            const safeId = Number(id);
            await db.runAsync('DELETE FROM exercises WHERE id = ? AND is_custom = 1', [safeId]);
            await get().loadExercises();
            CloudSyncService.scheduleBackup('exercise-deleted');
        } catch (e) {
            console.error("Failed to delete exercise", e);
            throw e;
        }
    },

    deleteWorkoutLog: async (id: number) => {
        try {
            const db = await getDatabase();
            // Delete sets first
            await db.runAsync('DELETE FROM workout_sets_v2 WHERE session_id = ?', [id]);
            // Delete session
            await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [id]);
            await get().loadHistory(10);
            await get().loadStreak();
            CloudSyncService.scheduleBackup('workout-deleted');
        } catch (e) {
            console.error("Failed to delete workout log", e);
            throw e;
        }
    },

    saveWorkoutLog: async (routineId: number | null, routineName: string, duration: number, notes: string, sets: any[]) => {
        try {
            const db = await getDatabase();
            let sessionId = 0;

            // Temporarily disable FK constraints to avoid issues
            await db.execAsync('PRAGMA foreign_keys = OFF;');

            try {
                const safeDuration = Number(duration) || 0; // In Seconds
                const safeNotes = notes ? String(notes) : '';
                const safeDate = new Date().toISOString();
                const safeName = routineName?.trim() || 'Quick Workout';

                const { useUserStore } = require('./useUserStore');
                const userStore = useUserStore.getState();
                const userId = userStore.user?.id;

                console.log("Saving workout session (Phase 1):", { safeName, safeDuration, setsCount: sets.length, userId });

                // Insert into workout_sessions
                const result = await db.runAsync(
                    'INSERT INTO workout_sessions (name, duration_seconds, notes, date, user_id, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [safeName, safeDuration, safeNotes, safeDate, userId || null, 'COMPLETED']
                );
                sessionId = result.lastInsertRowId;
                console.log("Session saved, sessionId:", sessionId);

                // Insert sets into workout_sets_v2
                for (let i = 0; i < sets.length; i++) {
                    const setData = sets[i];
                    const safeExerciseId = Number(setData.exerciseId);
                    const safeWeight = isNaN(Number(setData.weight)) ? 0 : Number(setData.weight);
                    const safeReps = isNaN(Number(setData.reps)) ? 0 : Number(setData.reps);
                    const safeRpe = setData.rpe ? Number(setData.rpe) : null;

                    // Skip invalid exercise IDs
                    if (!safeExerciseId || isNaN(safeExerciseId) || safeExerciseId <= 0) {
                        console.warn(`Skipping set with invalid exerciseId: ${setData.exerciseId}`);
                        continue;
                    }

                    await db.runAsync(
                        `INSERT INTO workout_sets_v2 (session_id, exercise_id, set_number, weight, reps, rpe) VALUES (?, ?, ?, ?, ?, ?)`,
                        [sessionId, safeExerciseId, i + 1, safeWeight, safeReps, safeRpe]
                    );
                }

                console.log("Workout session saved successfully");
                const refreshedHistory = await get().getWorkoutHistory(10);
                await get().loadStreak();
                set({ history: refreshedHistory });
                CloudSyncService.scheduleBackup('workout-saved');

            } finally {
                // Re-enable FK constraints
                await db.execAsync('PRAGMA foreign_keys = ON;');
            }
            return sessionId;
        } catch (e) {
            console.error("Failed to save workout session", e);
            throw e;
        }
    },

    getLastWorkoutLog: async (routineId: number) => {
        try {
            const db = await getDatabase();
            // Note: With the new schema, we don't strictly track 'routineId' in sessions.
            // We'll try to find the last session with the SAME NAME as the routine.

            const routines = await get().routines;
            const routine = routines.find(r => r.id === routineId);
            if (!routine) return null;

            const sessions = await db.getAllAsync<any>(
                'SELECT * FROM workout_sessions WHERE name = ? ORDER BY date DESC LIMIT 1',
                [routine.name]
            );

            const session = sessions.length > 0 ? sessions[0] : null;
            if (!session) return null;

            const safeSessionId = Number(session.id);
            const sets = await db.getAllAsync<any>(
                'SELECT * FROM workout_sets_v2 WHERE session_id = ? ORDER BY id ASC',
                [safeSessionId]
            );

            return {
                id: session.id,
                routineId: routineId, // derived from args
                date: session.date,
                durationSeconds: session.duration_seconds,
                notes: session.notes,
                sets: sets.map(s => ({
                    id: s.id,
                    exerciseId: s.exercise_id,
                    weight: s.weight,
                    reps: s.reps,
                    setNumber: s.set_number,
                    type: 'Normal' // v2 table doesn't have type yet, defaulting
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
            // Query workout_sessions
            const sessions = await db.getAllAsync<any>(
                'SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY date DESC LIMIT ?',
                [userId, limit]
            );

            // Enrich with summary data from workout_sets_v2
            const enrichedLogs: any[] = [];
            for (const session of sessions) {
                const sets = await db.getAllAsync<any>(
                    `SELECT ws.*, e.name as exercise_name 
                     FROM workout_sets_v2 ws
                     LEFT JOIN exercises e ON ws.exercise_id = e.id
                     WHERE ws.session_id = ?`,
                    [session.id]
                );

                const volume = sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
                const exercises = [...new Set(sets.map(s => s.exercise_name || 'Unknown'))];
                const exerciseSummaries = exercises.map(name => {
                    const exerciseSets = sets.filter(s => (s.exercise_name || 'Unknown') === name);
                    const bestSet = exerciseSets.reduce((best, current) => {
                        const bestScore = Number(best.weight || 0) * Number(best.reps || 0);
                        const currentScore = Number(current.weight || 0) * Number(current.reps || 0);
                        if (Number(current.weight || 0) > Number(best.weight || 0)) return current;
                        if (Number(current.weight || 0) === Number(best.weight || 0) && currentScore > bestScore) return current;
                        return best;
                    }, exerciseSets[0]);

                    return {
                        name,
                        sets: exerciseSets.length,
                        volume: exerciseSets.reduce((acc, s) => acc + (Number(s.weight || 0) * Number(s.reps || 0)), 0),
                        bestWeight: Number(bestSet?.weight || 0),
                        bestReps: Number(bestSet?.reps || 0),
                        bestEstimatedOneRepMax: Math.round(Number(bestSet?.weight || 0) * (1 + Number(bestSet?.reps || 0) / 30) * 10) / 10,
                    };
                });

                const enrichedLog = {
                    id: session.id,
                    date: session.date,
                    duration: Math.floor(session.duration_seconds / 60), // Convert back to minutes for UI if needed
                    routineName: session.name,
                    volume,
                    exercises,
                    setsCount: sets.length,
                    exerciseSummaries,
                    sets: sets.map(s => ({
                        id: s.id,
                        exerciseId: s.exercise_id,
                        exerciseName: s.exercise_name || 'Unknown',
                        setNumber: s.set_number,
                        weight: Number(s.weight || 0),
                        reps: Number(s.reps || 0),
                        volume: Number(s.weight || 0) * Number(s.reps || 0),
                        estimatedOneRepMax: Math.round(Number(s.weight || 0) * (1 + Number(s.reps || 0) / 30) * 10) / 10,
                    }))
                };
                enrichedLogs.push(enrichedLog);
            }

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

    loadStreak: async () => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id;

            if (!userId) {
                set({ streak: DEFAULT_STREAK });
                return;
            }

            const db = await getDatabase();
            const sessions = await db.getAllAsync<{ date: string }>(
                'SELECT date FROM workout_sessions WHERE user_id = ? AND status = ? ORDER BY date DESC',
                [userId, 'COMPLETED']
            );

            const streak = buildStreakStats(sessions.map((session) => session.date));
            set({ streak });
        } catch (e) {
            console.error("Failed to load streak", e);
            set({ streak: DEFAULT_STREAK });
        }
    },

    getExerciseHistory: async (exerciseId: number) => {
        try {
            const db = await getDatabase();
            const sets = await db.getAllAsync<any>(
                `SELECT ws.*, s.date, s.name as session_name
                 FROM workout_sets_v2 ws
                 JOIN workout_sessions s ON ws.session_id = s.id
                 WHERE ws.exercise_id = ? 
                 ORDER BY s.date ASC`,
                [exerciseId]
            );
            return sets;
        } catch (e) {
            console.error("Failed to get exercise history", e);
            return [];
        }
    },
}));
