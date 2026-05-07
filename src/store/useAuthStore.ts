import { create } from 'zustand';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signInAnonymously, signOut, User } from 'firebase/auth';
import { signOutGoogleSession } from '../services/authService';

export interface AuthUser {
    id: string;
    email: string | null;
    name: string | null;
    picture?: string | null;
    isAnonymous: boolean;
    provider?: 'firebase' | 'google' | 'anonymous';
}

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    loadAuthState: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
}

let authStateUnsubscribe: (() => void) | null = null;

function mapFirebaseUser(firebaseUser: User): AuthUser {
    const provider = firebaseUser.isAnonymous
        ? 'anonymous'
        : firebaseUser.providerData.some((entry) => entry.providerId === 'google.com')
            ? 'google'
            : 'firebase';

    return {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        picture: firebaseUser.photoURL,
        isAnonymous: firebaseUser.isAnonymous,
        provider,
    };
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    loadAuthState: async () => {
        set({ isLoading: true });
        if (authStateUnsubscribe) {
            const currentUser = auth.currentUser;
            set({
                user: currentUser ? mapFirebaseUser(currentUser) : null,
                isAuthenticated: !!currentUser,
                isLoading: false,
            });
            return;
        }

        await new Promise<void>((resolve) => {
            let resolved = false;

            authStateUnsubscribe = onAuthStateChanged(
                auth,
                (firebaseUser) => {
                    set({
                        user: firebaseUser ? mapFirebaseUser(firebaseUser) : null,
                        isAuthenticated: !!firebaseUser,
                        isLoading: false,
                    });

                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                },
                (error) => {
                    console.error('Auth state listener failed', error);
                    set({ user: null, isAuthenticated: false, isLoading: false });

                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                }
            );
        });
    },

    signInAsGuest: async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error('Guest sign-in failed', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOutGoogleSession();
            await signOut(auth);
            set({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error('Logout failed', error);
        }
    }
}));
