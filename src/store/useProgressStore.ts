import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { format } from 'date-fns';

export interface Measurement {
    id: number;
    date: string;
    weight: number;
    bodyFatPercentage?: number;
}

interface ProgressState {
    measurements: Measurement[];
    isLoading: boolean;

    loadMeasurements: () => Promise<void>;
    addMeasurement: (measurement: Omit<Measurement, 'id' | 'date'>, customDate?: string, syncToProfile?: boolean) => Promise<void>;
    deleteMeasurement: (id: number) => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    measurements: [],
    isLoading: false,

    loadMeasurements: async () => {
        set({ isLoading: true });
        try {
            const { useUserStore } = require('./useUserStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id;

            if (!userId) {
                set({ measurements: [], isLoading: false });
                return;
            }

            const db = await getDatabase();
            const results = await db.getAllAsync<any>('SELECT * FROM progress_measurements WHERE user_id = ? ORDER BY date DESC', [userId]);

            set({
                measurements: results.map(r => ({
                    id: r.id,
                    date: r.date,
                    weight: r.weight,
                    bodyFatPercentage: r.body_fat_percentage
                }))
            });
        } catch (e) {
            console.error("Failed to load measurements", e);
        } finally {
            set({ isLoading: false });
        }
    },

    addMeasurement: async (data, customDate?: string, syncToProfile: boolean = true) => {
        try {
            const db = await getDatabase();
            const dateStr = customDate || new Date().toISOString();
            const targetDate = format(new Date(dateStr), 'yyyy-MM-dd');

            const { useUserStore } = require('./useUserStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id;

            if (!userId) throw new Error("No user ID found");

            // Check if record exists for this date and user
            const existing = await db.getFirstAsync<any>(
                "SELECT id FROM progress_measurements WHERE date LIKE ? AND user_id = ? LIMIT 1",
                [`${targetDate}%`, userId]
            );

            if (existing) {
                await db.runAsync(
                    'UPDATE progress_measurements SET weight = ? WHERE id = ?',
                    [data.weight, existing.id]
                );
            } else {
                await db.runAsync(
                    `INSERT INTO progress_measurements (weight, date, user_id) VALUES (?, ?, ?)`,
                    [data.weight, dateStr, userId]
                );
            }

            // Sync with User Profile if requested
            // Sync with User Profile if requested
            if (syncToProfile) {
                try {
                    const { useUserStore } = require('./useUserStore');
                    const userStore = useUserStore.getState();
                    const userId = userStore.user?.id;

                    if (userId) {
                        await db.runAsync(
                            'UPDATE users SET weight = ? WHERE id = ?',
                            [data.weight, userId]
                        );
                        // Reload user to update UI state
                        await userStore.loadUser();
                    }
                } catch (syncError) {
                    console.error("Failed to sync weight to user profile", syncError);
                }
            }

            await get().loadMeasurements();
        } catch (e) {
            console.error("Failed to add/update measurement", e);
            throw e;
        }
    },

    deleteMeasurement: async (id) => {
        try {
            const db = await getDatabase();
            await db.runAsync('DELETE FROM progress_measurements WHERE id = ?', [id]);
            await get().loadMeasurements();
        } catch (e) {
            console.error("Failed to delete measurement", e);
        }
    }
}));
