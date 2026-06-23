import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { create } from 'zustand';
import type { MuscleGroup } from './useMuscleStore';
import { CloudSyncService } from '../services/cloudSyncService';
import { ActiveSet, ActiveWorkoutSession, Exercise, Routine, WorkoutLog, WorkoutSet, WorkoutStreak } from '../types';
import RoutineRepository from '../repositories/RoutineRepository';
import WorkoutSessionRepository from '../repositories/WorkoutSessionRepository';

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

function buildStreakStats(dates: string[], streakShields: number = 0): WorkoutStreak {
    if (dates.length === 0) {
        return DEFAULT_STREAK;
    }

    const uniqueDays = Array.from(new Set(dates.map(toDayKey))).sort((a, b) => b.localeCompare(a));
    const today = new Date();
    const todayKey = toDayKey(today);
    const parsedDays = uniqueDays.map((day) => new Date(`${day}T00:00:00`));
    const lastWorkoutDate = uniqueDays[0];
    const todayCompleted = uniqueDays.includes(todayKey);

    let current = 0;
    let shieldsRemaining = streakShields;
    let checkDate = new Date();
    if (!todayCompleted) {
        checkDate = subDays(new Date(), 1);
    }

    while (true) {
        const checkKey = toDayKey(checkDate);
        if (uniqueDays.includes(checkKey)) {
            current++;
            checkDate = subDays(checkDate, 1);
        } else if (shieldsRemaining > 0 && current > 0) {
            shieldsRemaining--;
            current++;
            checkDate = subDays(checkDate, 1);
        } else {
            break;
        }
    }

    let longest = 0;
    let running = 0;
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    if (parsedDays.length > 0) {
        let iterDate = parsedDays[parsedDays.length - 1];
        const maxDate = new Date();
        while (iterDate <= maxDate) {
            const iterKey = toDayKey(iterDate);
            if (uniqueDays.includes(iterKey)) {
                running++;
                longest = Math.max(longest, running);
            } else {
                running = 0;
            }
            iterDate = new Date(iterDate.getTime() + 86400000);
        }
    }

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

interface RoutineAnalytics {
    lastPerformed: string;
    avgDuration: number;
}

interface WorkoutState {
    routines: Routine[];
    routineAnalytics: Record<string, RoutineAnalytics>;
    exercises: Exercise[];
    history: WorkoutLog[];
    streak: WorkoutStreak;
    isLoading: boolean;
    activeWorkout: ActiveWorkoutSession | null;

    loadRoutines: () => Promise<void>;
    loadExercises: () => Promise<void>;
    loadHistory: (limit?: number, offset?: number, append?: boolean) => Promise<void>;
    addExercise: (exercise: { name: string; muscleGroup: string; type?: string; instructions?: string[]; images?: string[] }) => Promise<Exercise>;
    createRoutine: (name: string, exercises: { exerciseId: number; sets: number; reps: number }[], programId?: string) => Promise<void>;
    updateRoutine: (id: number, name: string, exercises: { exerciseId: number; sets: number; reps: number }[]) => Promise<void>;
    deleteRoutine: (id: number) => Promise<void>;
    togglePinRoutine: (id: number) => Promise<void>;
    deleteExercise: (id: number) => Promise<void>;

    saveWorkoutLog: (routineId: number | null, routineName: string, duration: number, notes: string, sets: any[], customDate?: Date) => Promise<number>;
    deleteWorkoutLog: (id: number) => Promise<void>;
    getLastWorkoutLog: (routineId: number) => Promise<WorkoutLog | null>;

    startWorkout: (routineId: number | null) => Promise<void>;
    updateActiveSet: (index: number, field: 'weight' | 'reps' | 'type', value: string) => void;
    toggleActiveSet: (index: number) => void;
    addActiveSet: (exerciseId: number, exerciseName: string) => void;
    removeActiveSet: (index: number) => void;
    finishActiveWorkout: (notes?: string) => Promise<number | null>;
    cancelActiveWorkout: () => void;
    getWorkoutHistory: (limit?: number, offset?: number) => Promise<any[]>;
    getExerciseHistory: (exerciseId: number) => Promise<any[]>;
    loadStreak: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    routines: [],
    routineAnalytics: {},
    exercises: [],
    history: [],
    streak: DEFAULT_STREAK,
    isLoading: false,
    activeWorkout: null,

    loadExercises: async () => {
        try {
            const exercises = await RoutineRepository.getExercises();
            set({ exercises });
        } catch (e) {
            console.error("Failed to load exercises", e);
        }
    },

    addExercise: async (exercise) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id || null;
            const newEx = await RoutineRepository.insertExercise(exercise, userId);
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
            const userId = useUserStore.getState().user?.id;
            if (!userId) {
                set({ routines: [], isLoading: false });
                return;
            }
            const { routines, analytics } = await RoutineRepository.getRoutinesWithExercises(userId);
            set({ routines, routineAnalytics: analytics });
        } catch (e) {
            console.error("Failed to load routines", e);
        } finally {
            set({ isLoading: false });
        }
    },

    createRoutine: async (name, exerciseList, programId) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) {
                console.error("No user ID found for creating routine");
                return;
            }
            await RoutineRepository.insertRoutine(
                String(name || 'New Routine'),
                exerciseList,
                programId || null,
                userId
            );
            await get().loadRoutines();
            CloudSyncService.scheduleBackup('routine-created');
        } catch (e) {
            console.error("Failed to create routine", e);
        }
    },

    updateRoutine: async (id, name, exerciseList) => {
        try {
            const safeId = parseInt(String(id), 10);
            if (isNaN(safeId)) {
                console.error("Invalid routine ID for update:", id);
                return;
            }
            await RoutineRepository.updateRoutine(safeId, String(name || 'Routine'), exerciseList);
            await get().loadRoutines();
            CloudSyncService.scheduleBackup('routine-updated');
        } catch (e) {
            console.error("Failed to update routine", e);
        }
    },

    deleteRoutine: async (id) => {
        const snapshot = get().routines;
        set(state => ({ routines: state.routines.filter(r => r.id !== id) }));
        try {
            await RoutineRepository.removeRoutine(Number(id));
            CloudSyncService.scheduleBackup('routine-deleted');
        } catch (e) {
            set({ routines: snapshot });
            console.error("Failed to delete routine", e);
            throw e;
        }
    },

    togglePinRoutine: async (id) => {
        const snapshot = get().routines;
        set(state => ({
            routines: state.routines.map(r => r.id === id ? { ...r, isPinned: !r.isPinned } : r),
        }));
        try {
            const routine = snapshot.find(r => r.id === id);
            if (!routine) return;
            await RoutineRepository.setPinned(id, !routine.isPinned);
        } catch (e) {
            set({ routines: snapshot });
            console.error("Failed to toggle pin on routine", e);
            throw e;
        }
    },

    deleteExercise: async (id) => {
        try {
            await RoutineRepository.removeExercise(Number(id));
            await get().loadExercises();
            CloudSyncService.scheduleBackup('exercise-deleted');
        } catch (e) {
            console.error("Failed to delete exercise", e);
            throw e;
        }
    },

    deleteWorkoutLog: async (id: number) => {
        const snapshot = get().history;
        set(state => ({ history: state.history.filter((h: any) => h.id !== id) }));
        try {
            await WorkoutSessionRepository.deleteSession(id);
            await get().loadStreak();
            CloudSyncService.scheduleBackup('workout-deleted');
        } catch (e) {
            set({ history: snapshot });
            console.error("Failed to delete workout log", e);
            throw e;
        }
    },

    saveWorkoutLog: async (routineId: number | null, routineName: string, duration: number, notes: string, sets: any[], customDate?: Date) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id || null;

            const safeDuration = Number(duration) || 0;
            const safeNotes = notes ? String(notes) : '';
            const safeDate = customDate ? customDate.toISOString() : new Date().toISOString();
            const safeName = routineName?.trim() || 'Quick Workout';

            const sessionId = await WorkoutSessionRepository.saveSession({
                name: safeName,
                durationSeconds: safeDuration,
                notes: safeNotes,
                date: safeDate,
                userId: userId || null,
                sets: sets
                    .filter(s => {
                        const eid = Number(s.exerciseId);
                        return eid && !isNaN(eid) && eid > 0;
                    })
                    .map(s => ({
                        exerciseId: Number(s.exerciseId),
                        exerciseName: s.exerciseName,
                        weight: isNaN(Number(s.weight)) ? 0 : Number(s.weight),
                        reps: isNaN(Number(s.reps)) ? 0 : Number(s.reps),
                        rpe: s.rpe ? Number(s.rpe) : null,
                    })),
            });

            // Calculate and save muscle stats
            try {
                const { getMuscleGroupsForExercise } = require('../services/muscleCalculationService');
                const MuscleRepositoryModule = require('../repositories/MuscleRepository').default;
                const allExercises = get().exercises;
                const statsMap = new Map<string, { volume: number; setCount: number; repCount: number }>();

                for (const setData of sets) {
                    const ex = allExercises.find(e => e.id === setData.exerciseId);
                    const muscles = getMuscleGroupsForExercise(
                        setData.exerciseName || ex?.name || '',
                        ex?.muscleGroup || ''
                    );
                    const volume = (Number(setData.weight) || 0) * (Number(setData.reps) || 0);
                    for (const muscle of muscles) {
                        if (!statsMap.has(muscle)) {
                            statsMap.set(muscle, { volume: 0, setCount: 0, repCount: 0 });
                        }
                        const stat = statsMap.get(muscle)!;
                        stat.volume += volume;
                        stat.setCount += 1;
                        stat.repCount += Number(setData.reps) || 0;
                    }
                }

                if (statsMap.size > 0 && userId) {
                    const dateStr = format(customDate || new Date(), 'yyyy-MM-dd');
                    const batch = Array.from(statsMap.entries()).map(([muscle, stat]) => ({
                        userId: String(userId),
                        muscleGroup: muscle,
                        date: dateStr,
                        volume: stat.volume,
                        setCount: stat.setCount,
                        repCount: stat.repCount,
                        intensity: Math.min(10, stat.volume / 50),
                    }));
                    await MuscleRepositoryModule.saveMuscleStatsBatch(batch);

                    try {
                        const useMuscleStore = require('../store/useMuscleStore').default;
                        const freshStats = await MuscleRepositoryModule.getTodaysMuscleStats(String(userId));
                        const freshWeekly = await MuscleRepositoryModule.getWeeklyMuscleStats(String(userId));
                        useMuscleStore.getState().setMuscleData(freshStats);
                        useMuscleStore.getState().setWeeklyData(freshWeekly);

                        const exerciseList = Array.from(statsMap.entries()).map(([muscle, stat]) => ({
                            muscleGroup: muscle as MuscleGroup,
                            exerciseName: 'Workout Session',
                            volume: stat.volume,
                        }));
                        useMuscleStore.getState().setTodaysExercises(exerciseList);
                    } catch (refreshErr) {
                        console.warn('Could not refresh muscle store:', refreshErr);
                    }
                }
            } catch (statsErr) {
                console.error("Failed to calculate and save muscle stats", statsErr);
            }

            const refreshedHistory = await get().getWorkoutHistory(10);
            await get().loadStreak();
            set({ history: refreshedHistory });
            CloudSyncService.scheduleBackup('workout-saved');

            // Gamification
            try {
                const { GamificationService } = require('../services/GamificationService');
                let totalVolume = 0;
                sets.forEach(s => {
                    totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
                });
                await GamificationService.evaluateWorkoutBadges(
                    { duration: safeDuration / 60, volume: totalVolume },
                    refreshedHistory.length
                );
            } catch (e) {
                console.warn("Gamification failed", e);
            }

            return sessionId;
        } catch (e) {
            console.error("Failed to save workout session", e);
            throw e;
        }
    },

    getLastWorkoutLog: async (routineId: number) => {
        try {
            const routine = get().routines.find(r => r.id === routineId);
            if (!routine) return null;
            return WorkoutSessionRepository.getLastSessionForRoutine(routine.name);
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
                            activeSets.push({
                                exerciseId: re.exerciseId,
                                setNumber: i + 1,
                                weight: prevSet ? String(prevSet.weight) : '',
                                reps: prevSet ? String(prevSet.reps) : String(re.reps || 10),
                                completed: false,
                                exerciseName: re.exercise.name,
                                exerciseImage: re.exercise.images?.[0] || null,
                                type: 'Normal',
                            });
                        }
                    });
                }
            }
        }

        set({
            activeWorkout: {
                startTime: Date.now(),
                routineId,
                routineName,
                activeSets,
                isRunning: true,
            },
        });
    },

    updateActiveSet: (index, field, value) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const newSets = [...activeWorkout.activeSets];
        newSets[index] = { ...newSets[index], [field]: value };
        set({ activeWorkout: { ...activeWorkout, activeSets: newSets } });
    },

    toggleActiveSet: (index) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const newSets = [...activeWorkout.activeSets];
        newSets[index].completed = !newSets[index].completed;
        set({ activeWorkout: { ...activeWorkout, activeSets: newSets } });
    },

    addActiveSet: (exerciseId, exerciseName) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const sets = [...activeWorkout.activeSets];
        let lastIndex = -1;
        let lastSetNumber = 0;
        for (let i = sets.length - 1; i >= 0; i--) {
            if (sets[i].exerciseId === exerciseId) {
                lastIndex = i;
                lastSetNumber = sets[i].setNumber;
                break;
            }
        }
        const newSet: ActiveSet = {
            exerciseId,
            exerciseName,
            setNumber: lastSetNumber + 1,
            weight: lastIndex >= 0 ? sets[lastIndex].weight : '0',
            reps: lastIndex >= 0 ? sets[lastIndex].reps : '10',
            completed: false,
            type: 'Normal',
        };
        if (lastIndex >= 0) {
            sets.splice(lastIndex + 1, 0, newSet);
        } else {
            sets.push(newSet);
        }
        set({ activeWorkout: { ...activeWorkout, activeSets: sets } });
    },

    removeActiveSet: (index) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const setToRemove = activeWorkout.activeSets[index];
        const sets = activeWorkout.activeSets.filter((_, i) => i !== index);
        let currentSetNum = 1;
        const updatedSets = sets.map(s => {
            if (s.exerciseId === setToRemove.exerciseId) {
                return { ...s, setNumber: currentSetNum++ };
            }
            return s;
        });
        set({ activeWorkout: { ...activeWorkout, activeSets: updatedSets } });
    },

    finishActiveWorkout: async (notes = '') => {
        const { activeWorkout, saveWorkoutLog } = get();
        if (!activeWorkout) return null;
        const duration = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
        const completedSets = activeWorkout.activeSets.filter(s => s.completed);
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
                type: s.type || 'Normal',
            }))
        );
        set({ activeWorkout: null });
        return workoutId;
    },

    cancelActiveWorkout: () => {
        set({ activeWorkout: null });
    },

    getWorkoutHistory: async (limit = 10, offset = 0) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return [];
            return WorkoutSessionRepository.getHistoryPage(userId, limit, offset);
        } catch (e) {
            console.error("Failed to get history", e);
            return [];
        }
    },

    loadHistory: async (limit = 10, offset = 0, append = false) => {
        const history = await get().getWorkoutHistory(limit, offset);
        if (append) {
            const currentHistory = get().history;
            const existingIds = new Set(currentHistory.map(h => h.id));
            const newHistory = history.filter(h => !existingIds.has(h.id));
            set({ history: [...currentHistory, ...newHistory] });
        } else {
            set({ history });
        }
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

            const dates = await WorkoutSessionRepository.getWorkoutDates(userId);
            const streakShields = userStore.user?.streakShields || 0;
            const streak = buildStreakStats(dates, streakShields);
            set({ streak });

            try {
                const { GamificationService } = require('../services/GamificationService');
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

                if (streakShields > 0 && streak.current > 0 && !dates.includes(todayStr) && !dates.includes(yesterdayStr)) {
                    const consumed = await GamificationService.consumeStreakShield(yesterdayStr);
                    if (consumed) {
                        setTimeout(() => get().loadStreak(), 500);
                    }
                }
                await GamificationService.checkStreakShields(streak.current);
            } catch (e) { }
        } catch (e) {
            console.error("Failed to load streak", e);
            set({ streak: DEFAULT_STREAK });
        }
    },

    getExerciseHistory: async (exerciseId: number) => {
        try {
            return WorkoutSessionRepository.getExerciseHistory(exerciseId);
        } catch (e) {
            console.error("Failed to get exercise history", e);
            return [];
        }
    },
}));
