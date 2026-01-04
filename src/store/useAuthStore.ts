import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
    provider: 'google' | 'email';
}

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: AuthUser | null) => void;
    login: (user: AuthUser) => Promise<void>;
    logout: () => Promise<void>;
    loadAuthState: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@gym_app_auth';

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    setUser: (user) => {
        set({ user, isAuthenticated: !!user });
    },

    login: async (user) => {
        try {
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error('Failed to save auth state:', error);
        }
    },

    logout: async () => {
        try {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            set({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error('Failed to clear auth state:', error);
        }
    },

    loadAuthState: async () => {
        try {
            set({ isLoading: true });
            const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            if (stored) {
                const user = JSON.parse(stored) as AuthUser;
                set({ user, isAuthenticated: true });
            }
        } catch (error) {
            console.error('Failed to load auth state:', error);
        } finally {
            set({ isLoading: false });
        }
    },
}));
