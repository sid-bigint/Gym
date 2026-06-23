import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { format } from 'date-fns';
import { CloudSyncService } from '../services/cloudSyncService';
import { SavedMeal, SavedMealItem, getSavedMeals, addSavedMeal } from '../services/savedMealsService';

export interface NutritionLog {
    id: number;
    date: string;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    mealSessionId?: number | null;
}

export interface MealSession {
    id: number;
    name: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    date: string;
    logs: NutritionLog[];
    totals: { calories: number; protein: number; carbs: number; fats: number };
}

export interface RecentFood {
    id: number;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    last_used_at: string;
    frequency_count: number;
    servingSize?: number;
    servingUnit?: string;
}

function calcTotals(logs: NutritionLog[]) {
    return logs.reduce(
        (acc, l) => ({
            calories: acc.calories + (l.calories || 0),
            protein: acc.protein + (l.protein || 0),
            carbs: acc.carbs + (l.carbs || 0),
            fats: acc.fats + (l.fats || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
}

interface NutritionState {
    logs: NutritionLog[];
    mealSessions: MealSession[];
    ungroupedLogs: NutritionLog[];
    recentFoods: RecentFood[];
    savedMeals: SavedMeal[];
    totals: { calories: number; protein: number; carbs: number; fats: number };
    isLoading: boolean;
    selectedDate: Date;

    setDate: (date: Date) => void;
    loadLogs: () => Promise<void>;
    addLog: (log: Omit<NutritionLog, 'id' | 'date'>) => Promise<void>;
    updateLog: (log: NutritionLog) => Promise<void>;
    deleteLog: (id: number) => Promise<void>;
    getNutritionHistory: (days?: number) => Promise<any[]>;

    // Meal Session Actions
    createMealSession: (
        name: string,
        mealType: string,
        items: Array<Omit<NutritionLog, 'id' | 'date'>>,
        existingSessionId?: number
    ) => Promise<void>;
    renameMealSession: (id: number, name: string) => Promise<void>;
    deleteMealSession: (id: number) => Promise<void>;

    // Recent Foods Actions
    loadRecentFoods: () => Promise<void>;
    addRecentFood: (food: Omit<RecentFood, 'id' | 'last_used_at' | 'frequency_count'>) => Promise<void>;

    // Saved Meals Actions
    loadSavedMeals: () => Promise<void>;
    saveMealFromLogs: (name: string, logs: NutritionLog[]) => Promise<void>;
    logSavedMeal: (meal: SavedMeal, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => Promise<void>;
    updateSavedMeal: (id: number, name: string, items: SavedMealItem[]) => Promise<void>;
    deleteSavedMeal: (id: number) => Promise<void>;
    duplicateSavedMeal: (meal: SavedMeal) => Promise<void>;
    copyDay: (sourceDate: Date, targetDate: Date) => Promise<void>;

    // Water Tracking
    waterGlasses: number;
    loadWater: () => Promise<void>;
    updateWater: (glasses: number) => Promise<void>;
    getRecentLogs: (limit?: number) => Promise<any[]>;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
    logs: [],
    mealSessions: [],
    ungroupedLogs: [],
    recentFoods: [],
    savedMeals: [],
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    isLoading: false,
    selectedDate: new Date(),
    waterGlasses: 0,

    setDate: (date: Date) => {
        set({ selectedDate: date });
        get().loadLogs();
        get().loadWater();
    },

    loadLogs: async () => {
        const { selectedDate } = get();
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        set({ isLoading: true });

        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;

            if (!userId) {
                set({
                    logs: [], mealSessions: [], ungroupedLogs: [],
                    totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
                    isLoading: false,
                });
                return;
            }

            const db = await getDatabase();

            // Load sessions + logs in parallel
            const [sessionRows, logRows] = await Promise.all([
                db.getAllAsync<any>(
                    'SELECT * FROM meal_sessions WHERE date = ? AND user_id = ? ORDER BY id ASC',
                    [dateStr, userId]
                ),
                db.getAllAsync<any>(
                    'SELECT * FROM nutrition_logs WHERE date LIKE ? AND user_id = ? ORDER BY id ASC',
                    [`${dateStr}%`, userId]
                ),
            ]);

            const allLogs: NutritionLog[] = logRows.map((l: any) => ({
                id: l.id,
                date: l.date,
                foodName: l.name,
                calories: l.calories,
                protein: l.protein,
                carbs: l.carbs,
                fats: l.fats,
                mealType: l.type,
                mealSessionId: l.meal_session_id ?? null,
            }));

            // Build session objects with their logs
            const mealSessions: MealSession[] = sessionRows.map((s: any) => {
                const sessionLogs = allLogs.filter(l => l.mealSessionId === s.id);
                return {
                    id: s.id,
                    name: s.name,
                    mealType: s.meal_type,
                    date: s.date,
                    logs: sessionLogs,
                    totals: calcTotals(sessionLogs),
                };
            });

            const ungroupedLogs = allLogs.filter(l => !l.mealSessionId);
            const totals = calcTotals(allLogs);

            set({ logs: allLogs, mealSessions, ungroupedLogs, totals });
            await get().loadRecentFoods();
            await get().loadSavedMeals();
            await get().loadWater();
        } catch (e) {
            console.error("Failed to load nutrition logs", e);
        } finally {
            set({ isLoading: false });
        }
    },

    // Create a new named meal session and log all items under it.
    // If existingSessionId is provided, just adds items to that session instead.
    createMealSession: async (name, mealType, items, existingSessionId) => {
        const { selectedDate } = get();
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) throw new Error("No user ID");

            const db = await getDatabase();
            let sessionId = existingSessionId;

            if (!sessionId) {
                const result = await db.runAsync(
                    'INSERT INTO meal_sessions (user_id, date, name, meal_type) VALUES (?, ?, ?, ?)',
                    [userId, dateStr, name.trim() || mealType, mealType]
                );
                sessionId = result.lastInsertRowId;
            }

            for (const item of items) {
                await db.runAsync(
                    `INSERT INTO nutrition_logs (date, name, calories, protein, carbs, fats, type, user_id, meal_session_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [dateStr, item.foodName, item.calories, item.protein, item.carbs, item.fats, mealType, userId, sessionId]
                );
                await get().addRecentFood({
                    name: item.foodName,
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fats: item.fats,
                });
            }

            await get().loadLogs();
            CloudSyncService.scheduleBackup('meal-session-created');
        } catch (e) {
            console.error("Failed to create meal session", e);
            throw e;
        }
    },

    renameMealSession: async (id, name) => {
        // Optimistic update
        set(state => ({
            mealSessions: state.mealSessions.map(s =>
                s.id === id ? { ...s, name: name.trim() } : s
            ),
        }));
        try {
            const db = await getDatabase();
            await db.runAsync('UPDATE meal_sessions SET name = ? WHERE id = ?', [name.trim(), id]);
            CloudSyncService.scheduleBackup('meal-session-renamed');
        } catch (e) {
            console.error("Failed to rename meal session", e);
            await get().loadLogs();
        }
    },

    deleteMealSession: async (id) => {
        // Optimistic: remove session + its logs from state
        const snapshot = { mealSessions: get().mealSessions, logs: get().logs, ungroupedLogs: get().ungroupedLogs };
        set(state => ({
            mealSessions: state.mealSessions.filter(s => s.id !== id),
            logs: state.logs.filter(l => l.mealSessionId !== id),
        }));
        try {
            const db = await getDatabase();
            await db.runAsync('DELETE FROM nutrition_logs WHERE meal_session_id = ?', [id]);
            await db.runAsync('DELETE FROM meal_sessions WHERE id = ?', [id]);
            // Recompute totals
            const remaining = get().logs;
            set({ totals: calcTotals(remaining) });
            CloudSyncService.scheduleBackup('meal-session-deleted');
        } catch (e) {
            set(snapshot);
            console.error("Failed to delete meal session", e);
        }
    },

    addLog: async (log) => {
        const { selectedDate } = get();
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) throw new Error("No user ID found");

            const db = await getDatabase();
            await db.runAsync(
                `INSERT INTO nutrition_logs (date, name, calories, protein, carbs, fats, type, user_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [dateStr, log.foodName, log.calories, log.protein, log.carbs, log.fats, log.mealType, userId]
            );

            await get().addRecentFood({
                name: log.foodName,
                calories: log.calories,
                protein: log.protein,
                carbs: log.carbs,
                fats: log.fats,
            });

            await get().loadLogs();
            CloudSyncService.scheduleBackup('nutrition-log-created');
        } catch (e) {
            console.error("Failed to add nutrition log", e);
            throw e;
        }
    },

    updateLog: async (log) => {
        try {
            const db = await getDatabase();
            await db.runAsync(
                `UPDATE nutrition_logs
                 SET name = ?, calories = ?, protein = ?, carbs = ?, fats = ?, type = ?
                 WHERE id = ?`,
                [log.foodName, log.calories, log.protein, log.carbs, log.fats, log.mealType, log.id]
            );
            await get().loadLogs();
            CloudSyncService.scheduleBackup('nutrition-log-updated');
        } catch (e) {
            console.error("Failed to update nutrition log", e);
            throw e;
        }
    },

    deleteLog: async (id) => {
        try {
            const db = await getDatabase();
            const log = get().logs.find(l => l.id === id);
            const sessionId = log?.mealSessionId;

            await db.runAsync('DELETE FROM nutrition_logs WHERE id = ?', [id]);

            // Auto-delete session if now empty
            if (sessionId) {
                const remaining = await db.getAllAsync<any>(
                    'SELECT id FROM nutrition_logs WHERE meal_session_id = ?',
                    [sessionId]
                );
                if (remaining.length === 0) {
                    await db.runAsync('DELETE FROM meal_sessions WHERE id = ?', [sessionId]);
                }
            }

            await get().loadLogs();
            CloudSyncService.scheduleBackup('nutrition-log-deleted');
        } catch (e) {
            console.error("Failed to delete nutrition log", e);
        }
    },

    getNutritionHistory: async (days = 7) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return [];

            const db = await getDatabase();
            const results = await db.getAllAsync<any>(
                `SELECT date, SUM(calories) as calories, SUM(protein) as protein,
                        SUM(carbs) as carbs, SUM(fats) as fats
                 FROM nutrition_logs
                 WHERE user_id = ?
                 GROUP BY date
                 ORDER BY date DESC
                 LIMIT ?`,
                [userId, days]
            );
            return results || [];
        } catch (e) {
            console.error("Failed to get nutrition history", e);
            return [];
        }
    },

    loadRecentFoods: async () => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const db = await getDatabase();
            const recent = await db.getAllAsync<any>(
                'SELECT * FROM recent_foods WHERE user_id = ? ORDER BY last_used_at DESC LIMIT 20',
                [userId]
            );
            set({ recentFoods: recent });
        } catch (e) {
            console.error("Failed to load recent foods", e);
        }
    },

    addRecentFood: async (food) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const db = await getDatabase();
            const existing = await db.getFirstAsync<any>(
                'SELECT id, frequency_count FROM recent_foods WHERE user_id = ? AND name = ?',
                [userId, food.name]
            );

            if (existing) {
                await db.runAsync(
                    'UPDATE recent_foods SET frequency_count = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [existing.frequency_count + 1, existing.id]
                );
            } else {
                await db.runAsync(
                    `INSERT INTO recent_foods (user_id, name, calories, protein, carbs, fats) VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, food.name, food.calories, food.protein, food.carbs, food.fats]
                );
            }
        } catch (e) {
            console.error("Failed to add recent food", e);
        }
    },

    loadSavedMeals: async () => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const meals = await getSavedMeals(userId as any);
            set({ savedMeals: meals });
        } catch (e) {
            console.error("Failed to load saved meals", e);
        }
    },

    saveMealFromLogs: async (name, logs) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const items = logs.map(l => ({
                id: String(l.id),
                name: l.foodName,
                grams: 100,
                calories: l.calories,
                protein: l.protein,
                carbs: l.carbs,
                fats: l.fats,
            }));

            await addSavedMeal(userId as any, name, items);
            await get().loadSavedMeals();
        } catch (e) {
            console.error("Failed to save meal from logs", e);
        }
    },

    logSavedMeal: async (meal, mealType) => {
        try {
            const { selectedDate } = get();
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const db = await getDatabase();

            // Create a session for the saved meal
            const result = await db.runAsync(
                'INSERT INTO meal_sessions (user_id, date, name, meal_type) VALUES (?, ?, ?, ?)',
                [userId, dateStr, meal.name, mealType]
            );
            const sessionId = result.lastInsertRowId;

            for (const item of meal.items) {
                await db.runAsync(
                    `INSERT INTO nutrition_logs (date, name, calories, protein, carbs, fats, type, user_id, meal_session_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [dateStr, item.name, item.calories, item.protein, item.carbs, item.fats, mealType, userId, sessionId]
                );
                await get().addRecentFood({
                    name: item.name,
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fats: item.fats,
                });
            }

            await get().loadLogs();
            CloudSyncService.scheduleBackup('saved-meal-logged');
        } catch (e) {
            console.error("Failed to log saved meal", e);
        }
    },

    updateSavedMeal: async (id, name, items) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const { updateSavedMeal: updateService } = require('../services/savedMealsService');
            await updateService(id, userId, name, items);
            await get().loadSavedMeals();
        } catch (e) {
            console.error("Failed to update saved meal", e);
        }
    },

    deleteSavedMeal: async (id) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const { deleteSavedMeal: deleteService } = require('../services/savedMealsService');
            await deleteService(id, userId);
            await get().loadSavedMeals();
        } catch (e) {
            console.error("Failed to delete saved meal", e);
        }
    },

    duplicateSavedMeal: async (meal) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const { addSavedMeal: addService } = require('../services/savedMealsService');
            await addService(userId as any, `${meal.name} (Copy)`, meal.items);
            await get().loadSavedMeals();
        } catch (e) {
            console.error("Failed to duplicate saved meal", e);
        }
    },

    copyDay: async (sourceDate: Date, targetDate: Date) => {
        try {
            const sourceStr = format(sourceDate, 'yyyy-MM-dd');
            const targetStr = format(targetDate, 'yyyy-MM-dd');
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const db = await getDatabase();

            const sourceLogs = await db.getAllAsync<any>(
                'SELECT * FROM nutrition_logs WHERE date LIKE ? AND user_id = ?',
                [`${sourceStr}%`, userId]
            );
            if (sourceLogs.length === 0) return;

            // Group by original session so the copy preserves structure
            const sessionMap = new Map<number | null, any[]>();
            for (const log of sourceLogs) {
                const key = log.meal_session_id ?? null;
                const arr = sessionMap.get(key) || [];
                arr.push(log);
                sessionMap.set(key, arr);
            }

            for (const [origSessionId, logs] of sessionMap) {
                let newSessionId: number | null = null;

                if (origSessionId !== null) {
                    const origSession = await db.getFirstAsync<any>(
                        'SELECT * FROM meal_sessions WHERE id = ?',
                        [origSessionId]
                    );
                    if (origSession) {
                        const res = await db.runAsync(
                            'INSERT INTO meal_sessions (user_id, date, name, meal_type) VALUES (?, ?, ?, ?)',
                            [userId, targetStr, origSession.name, origSession.meal_type]
                        );
                        newSessionId = res.lastInsertRowId;
                    }
                }

                for (const log of logs) {
                    await db.runAsync(
                        `INSERT INTO nutrition_logs (date, name, calories, protein, carbs, fats, type, user_id, meal_session_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [targetStr, log.name, log.calories, log.protein, log.carbs, log.fats, log.type, userId, newSessionId]
                    );
                }
            }

            await get().loadLogs();
            CloudSyncService.scheduleBackup('nutrition-day-copied');
        } catch (e) {
            console.error("Failed to copy day", e);
        }
    },

    loadWater: async () => {
        try {
            const { selectedDate } = get();
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const db = await getDatabase();
            const result = await db.getFirstAsync<any>(
                'SELECT glasses FROM water_logs WHERE user_id = ? AND date = ?',
                [userId, dateStr]
            );
            set({ waterGlasses: result?.glasses || 0 });
        } catch (e) {
            console.error("Failed to load water", e);
        }
    },

    updateWater: async (glasses: number) => {
        try {
            const { selectedDate } = get();
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return;

            const db = await getDatabase();
            await db.runAsync(
                `INSERT INTO water_logs (user_id, date, glasses)
                 VALUES (?, ?, ?)
                 ON CONFLICT(user_id, date) DO UPDATE SET glasses = excluded.glasses`,
                [userId, dateStr, glasses]
            );
            set({ waterGlasses: glasses });
            CloudSyncService.scheduleBackup('water-updated');
        } catch (e) {
            console.error("Failed to update water", e);
        }
    },

    getRecentLogs: async (limit = 20) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userId = useUserStore.getState().user?.id;
            if (!userId) return [];

            const db = await getDatabase();
            const results = await db.getAllAsync<any>(
                `SELECT DISTINCT name, calories, protein, carbs, fats, type
                 FROM nutrition_logs
                 WHERE user_id = ?
                 ORDER BY id DESC
                 LIMIT ?`,
                [userId, limit]
            );

            return results.map((r: any) => ({
                foodName: r.name,
                calories: r.calories,
                protein: r.protein,
                carbs: r.carbs,
                fats: r.fats,
                mealType: r.type,
            }));
        } catch (e) {
            console.error("Failed to get recent logs", e);
            return [];
        }
    },
}));
