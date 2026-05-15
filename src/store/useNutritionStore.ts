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

interface NutritionState {
    logs: NutritionLog[];
    recentFoods: RecentFood[];
    savedMeals: SavedMeal[];
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    isLoading: boolean;
    selectedDate: Date;

    setDate: (date: Date) => void;
    loadLogs: () => Promise<void>;
    addLog: (log: Omit<NutritionLog, 'id' | 'date'>) => Promise<void>;
    updateLog: (log: NutritionLog) => Promise<void>;
    deleteLog: (id: number) => Promise<void>;
    getNutritionHistory: (days?: number) => Promise<any[]>;

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
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id;

            if (!userId) {
                set({ logs: [], totals: { calories: 0, protein: 0, carbs: 0, fats: 0 }, isLoading: false });
                return;
            }

            const db = await getDatabase();
            const logs = await db.getAllAsync<any>(
                'SELECT * FROM nutrition_logs WHERE date LIKE ? AND user_id = ? ORDER BY id DESC',
                [`${dateStr}%`, userId]
            );

            const mappedLogs: NutritionLog[] = logs.map(l => ({
                id: l.id,
                date: l.date,
                foodName: l.name,
                calories: l.calories,
                protein: l.protein,
                carbs: l.carbs,
                fats: l.fats,
                mealType: l.type
            }));

            const totals = mappedLogs.reduce((acc, log) => ({
                calories: acc.calories + (log.calories || 0),
                protein: acc.protein + (log.protein || 0),
                carbs: acc.carbs + (log.carbs || 0),
                fats: acc.fats + (log.fats || 0)
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            set({ logs: mappedLogs, totals });
            await get().loadRecentFoods();
            await get().loadSavedMeals();
            await get().loadWater();

        } catch (e) {
            console.error("Failed to load nutrition logs", e);
        } finally {
            set({ isLoading: false });
        }
    },

    addLog: async (log) => {
        const { selectedDate } = get();
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        try {
            const { useUserStore } = require('./useUserStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id;

            if (!userId) throw new Error("No user ID found");

            const db = await getDatabase();
            await db.runAsync(
                `INSERT INTO nutrition_logs (date, name, calories, protein, carbs, fats, type, user_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [dateStr, log.foodName, log.calories, log.protein, log.carbs, log.fats, log.mealType, userId]
            );

            // Add to recent foods
            await get().addRecentFood({
                name: log.foodName,
                calories: log.calories,
                protein: log.protein,
                carbs: log.carbs,
                fats: log.fats
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
            await db.runAsync('DELETE FROM nutrition_logs WHERE id = ?', [id]);
            await get().loadLogs();
            CloudSyncService.scheduleBackup('nutrition-log-deleted');
        } catch (e) {
            console.error("Failed to delete nutrition log", e);
        }
    },

    getNutritionHistory: async (days = 7) => {
        try {
            const { useUserStore } = require('./useUserStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id;

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

            // Check if food exists to update frequency or insert new
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
                    `INSERT INTO recent_foods (user_id, name, calories, protein, carbs, fats)
                     VALUES (?, ?, ?, ?, ?, ?)`,
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
                grams: 100, // Default to 100g or preserve from log if we had it
                calories: l.calories,
                protein: l.protein,
                carbs: l.carbs,
                fats: l.fats
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
            
            for (const item of meal.items) {
                await db.runAsync(
                    `INSERT INTO nutrition_logs (date, name, calories, protein, carbs, fats, type, user_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [dateStr, item.name, item.calories, item.protein, item.carbs, item.fats, mealType, userId]
                );
                
                await get().addRecentFood({
                    name: item.name,
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fats: item.fats
                });
            }

            await get().loadLogs();
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

            const { addSavedMeal } = require('../services/savedMealsService');
            await addSavedMeal(userId as any, `${meal.name} (Copy)`, meal.items);
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
            
            // Get logs from source date
            const sourceLogs = await db.getAllAsync<any>(
                'SELECT * FROM nutrition_logs WHERE date LIKE ? AND user_id = ?',
                [`${sourceStr}%`, userId]
            );

            if (sourceLogs.length === 0) return;

            // Insert into target date
            for (const log of sourceLogs) {
                await db.runAsync(
                    `INSERT INTO nutrition_logs (date, name, calories, protein, carbs, fats, type, user_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [targetStr, log.name, log.calories, log.protein, log.carbs, log.fats, log.type, userId]
                );
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
            
            return results.map(r => ({
                foodName: r.name,
                calories: r.calories,
                protein: r.protein,
                carbs: r.carbs,
                fats: r.fats,
                mealType: r.type
            }));
        } catch (e) {
            console.error("Failed to get recent logs", e);
            return [];
        }
    }
}));