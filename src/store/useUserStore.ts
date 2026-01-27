import { create } from 'zustand';
import { UserProfile } from '../types';
import { UserRepository } from '../repositories/UserRepository';
import { CloudRepository } from '../repositories/CloudRepository';

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
            // Use Repository to fetch user
            const dbUser = await UserRepository.getCurrentUser();

            if (dbUser) {
                set({
                    user: {
                        id: dbUser.id,
                        name: dbUser.name ?? 'User',
                        gender: (dbUser.gender as any) ?? 'male',
                        age: dbUser.age ?? 25,
                        height: dbUser.height ?? 175,
                        weight: dbUser.weight ?? 70,
                        activityLevel: (dbUser.activityLevel as any) ?? 'moderate',
                        goal: (dbUser.goal as any) ?? 'maintain',
                        calorieGoal: dbUser.targetCalories ?? 2500,
                        targetProtein: dbUser.targetProtein ?? 150,
                        targetCarbs: dbUser.targetCarbs ?? 300,
                        targetFats: dbUser.targetFats ?? 80,
                        picture: dbUser.picture
                    }
                });
            } else {
                // ... (default user creation code remains same but we might want to check cloud here in future steps)
                const defaultUser = {
                    name: 'User',
                    gender: 'male',
                    age: 25,
                    height: 175,
                    weight: 70,
                    activityLevel: 'moderate',
                    goal: 'maintain',
                    targetCalories: 2500,
                    targetProtein: 150,
                    targetCarbs: 300,
                    targetFats: 80,
                    picture: null
                };
                const newUser = await UserRepository.createUser(defaultUser);
                if (newUser) {
                    set({
                        user: {
                            id: newUser.id,
                            name: newUser.name ?? 'User',
                            gender: (newUser.gender as any) ?? 'male',
                            age: newUser.age ?? 25,
                            height: newUser.height ?? 175,
                            weight: newUser.weight ?? 70,
                            activityLevel: (newUser.activityLevel as any) ?? 'moderate',
                            goal: (newUser.goal as any) ?? 'maintain',
                            calorieGoal: newUser.targetCalories ?? 2500,
                            targetProtein: newUser.targetProtein ?? 150,
                            targetCarbs: newUser.targetCarbs ?? 300,
                            targetFats: newUser.targetFats ?? 80,
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
            if (!user || !user.id) return;

            const updatedUser = { ...user, ...updates };

            // 1. Local SQLite Update (Single Source of Truth)
            // We safely cast to Number in case the UI sent strings
            await UserRepository.updateUser(user.id, {
                name: updatedUser.name,
                gender: updatedUser.gender,
                age: Number(updatedUser.age),
                height: Number(updatedUser.height),
                weight: Number(updatedUser.weight),
                activityLevel: updatedUser.activityLevel,
                goal: updatedUser.goal,
                targetCalories: Number(updatedUser.calorieGoal),
                targetProtein: Number(updatedUser.targetProtein),
                targetCarbs: Number(updatedUser.targetCarbs),
                targetFats: Number(updatedUser.targetFats),
                picture: updatedUser.picture
            });

            // 2. Cloud Sync (Background Backup)
            // Fire and forget - don't block the UI
            CloudRepository.syncUserToCloud(updatedUser).catch(err => {
                console.warn('Background Cloud Sync failed', err);
            });

            // 3. Side Effects (Progress Store)
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
