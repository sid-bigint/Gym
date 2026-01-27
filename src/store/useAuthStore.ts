import { create } from 'zustand';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export interface AuthUser {
    id: string;
    email: string | null;
    name: string | null;
    picture?: string | null;
    isAnonymous: boolean;
}

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    loadAuthState: () => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    loadAuthState: () => {
        set({ isLoading: true });
        // Firebase Auth Listener
        onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const user: AuthUser = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName,
                    picture: firebaseUser.photoURL,
                    isAnonymous: firebaseUser.isAnonymous
                };
                set({ user, isAuthenticated: true, isLoading: false });
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        });
    },

    logout: async () => {
        try {
            await signOut(auth);
            set({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error('Logout failed', error);
        }
    }
}));
