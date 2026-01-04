import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { UserProfile, ActivityLevel, FitnessGoal } from '../types';

interface UserState {
    user: UserProfile | null;
    isLoading: boolean;

    tempProfileData: Partial<UserProfile> | null;
    setTempProfileData: (data: Partial<UserProfile> | null) => void;

    loadUser: () => Promise<void>;
    updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
    calculateMacros: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    isLoading: false,
    tempProfileData: null,
    setTempProfileData: (data) => set({ tempProfileData: data }),

    loadUser: async () => {
        set({ isLoading: true });
        try {
            const db = await getDatabase();
            const result = await db.getFirstAsync<any>('SELECT * FROM users LIMIT 1');

            if (result) {
                set({
                    user: {
                        id: result.id,
                        name: result.name,
                        gender: result.gender as any,
                        age: result.age,
                        height: result.height,
                        weight: result.weight,
                        activityLevel: result.activity_level as any,
                        goal: result.goal as any,
                        calorieGoal: result.target_calories,
                        targetProtein: result.target_protein,
                        targetCarbs: result.target_carbs,
                        targetFats: result.target_fats,
                        picture: result.picture // Load picture
                    }
                });
            } else {
                // Create default user if not exists
                const defaultUser: UserProfile = {
                    name: 'User',
                    gender: 'male',
                    age: 25,
                    height: 175,
                    weight: 70,
                    activityLevel: 'moderate',
                    goal: 'maintain',
                    calorieGoal: 2500,
                    targetProtein: 150,
                    targetCarbs: 300,
                    targetFats: 80,
                    picture: null
                };

                await db.runAsync(
                    `INSERT INTO users (
                name, gender, age, height, weight, activity_level, goal, 
                target_calories, target_protein, target_carbs, target_fats, picture
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        defaultUser.name, defaultUser.gender, defaultUser.age, defaultUser.height, defaultUser.weight,
                        defaultUser.activityLevel, defaultUser.goal, defaultUser.calorieGoal,
                        defaultUser.targetProtein, defaultUser.targetCarbs, defaultUser.targetFats,
                        defaultUser.picture || null
                    ]
                );
                // Reload to get ID
                const newUser = await db.getFirstAsync<any>('SELECT * FROM users LIMIT 1');
                if (newUser) {
                    set({
                        user: {
                            id: newUser.id,
                            name: newUser.name,
                            gender: newUser.gender as any,
                            age: newUser.age,
                            height: newUser.height,
                            weight: newUser.weight,
                            activityLevel: newUser.activity_level as any,
                            goal: newUser.goal as any,
                            calorieGoal: newUser.target_calories,
                            targetProtein: newUser.target_protein,
                            targetCarbs: newUser.target_carbs,
                            targetFats: newUser.target_fats,
                            picture: newUser.picture
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Failed to load user", e);
        } finally {
            set({ isLoading: false });
        }
    },

    updateProfile: async (updates) => {
        try {
            const { user } = get();
            if (!user) return;

            const updatedUser = { ...user, ...updates };

            const db = await getDatabase();

            // Ensure inputs are not undefined
            const safeParams = [
                updatedUser.name || '',
                updatedUser.gender || 'male',
                Number(updatedUser.age) || 0,
                Number(updatedUser.height) || 0,
                Number(updatedUser.weight) || 0,
                updatedUser.activityLevel || 'moderate',
                updatedUser.goal || 'maintain',
                Number(updatedUser.calorieGoal) || 0,
                Number(updatedUser.targetProtein) || 0,
                Number(updatedUser.targetCarbs) || 0,
                Number(updatedUser.targetFats) || 0,
                updatedUser.picture || null,
                updatedUser.id || 0
            ];

            await db.runAsync(
                `UPDATE users SET 
                name = ?, gender = ?, age = ?, height = ?, weight = ?, activity_level = ?, goal = ?, 
                target_calories = ?, target_protein = ?, target_carbs = ?, target_fats = ?, picture = ?
            WHERE id = ?`,
                safeParams
            );

            // Sync weight to progress history if changed
            if (updatedUser.weight && user.weight !== updatedUser.weight) {
                const { useProgressStore } = require('./useProgressStore');
                await useProgressStore.getState().addMeasurement(
                    { weight: Number(updatedUser.weight) },
                    undefined,
                    false // Do NOT sync back to profile, we just did that
                );
            }

            set({ user: updatedUser });

        } catch (e) {
            console.error("Failed to update profile", e);
        }
    },

    calculateMacros: () => {
        // Placeholder for macro calc logic
    }
}));
