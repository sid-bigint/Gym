import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { format } from 'date-fns';

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

interface NutritionState {
    logs: NutritionLog[];
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
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
    logs: [],
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    isLoading: false,
    selectedDate: new Date(),

    setDate: (date: Date) => {
        set({ selectedDate: date });
        get().loadLogs();
    },

    loadLogs: async () => {
        const { selectedDate } = get();
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        set({ isLoading: true });

        try {
            const db = await getDatabase();
            // Query nutrition_logs table using correct column names: name, type
            const logs = await db.getAllAsync<any>(
                'SELECT * FROM nutrition_logs WHERE date LIKE ? ORDER BY id DESC',
                [`${dateStr}%`]
            );

            // Map DB columns to interface: name→foodName, type→mealType
            const mappedLogs: NutritionLog[] = logs.map(l => ({
                id: l.id,
                date: l.date,
                foodName: l.name,      // DB column is 'name'
                calories: l.calories,
                protein: l.protein,
                carbs: l.carbs,
                fats: l.fats,
                mealType: l.type       // DB column is 'type'
            }));

            const totals = mappedLogs.reduce((acc, log) => ({
                calories: acc.calories + (log.calories || 0),
                protein: acc.protein + (log.protein || 0),
                carbs: acc.carbs + (log.carbs || 0),
                fats: acc.fats + (log.fats || 0)
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            set({ logs: mappedLogs, totals });

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
            const db = await getDatabase();
            // Use correct column names: name, type
            await db.runAsync(
                `INSERT INTO nutrition_logs (date, name, calories, protein, carbs, fats, type)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [dateStr, log.foodName, log.calories, log.protein, log.carbs, log.fats, log.mealType]
            );
            await get().loadLogs();
        } catch (e) {
            console.error("Failed to add nutrition log", e);
            throw e;
        }
    },

    updateLog: async (log) => {
        try {
            const db = await getDatabase();
            // Use correct column names: name, type
            await db.runAsync(
                `UPDATE nutrition_logs 
                 SET name = ?, calories = ?, protein = ?, carbs = ?, fats = ?, type = ?
                 WHERE id = ?`,
                [log.foodName, log.calories, log.protein, log.carbs, log.fats, log.mealType, log.id]
            );
            await get().loadLogs();
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
        } catch (e) {
            console.error("Failed to delete nutrition log", e);
        }
    },
    getNutritionHistory: async (days = 7) => {
        try {
            const db = await getDatabase();
            // Get all logs from the last X days
            const results = await db.getAllAsync<any>(
                `SELECT date, SUM(calories) as calories, SUM(protein) as protein, 
                        SUM(carbs) as carbs, SUM(fats) as fats
                 FROM nutrition_logs 
                 GROUP BY date 
                 ORDER BY date DESC 
                 LIMIT ?`,
                [days]
            );
            return results || [];
        } catch (e) {
            console.error("Failed to get nutrition history", e);
            return [];
        }
    }
}));
