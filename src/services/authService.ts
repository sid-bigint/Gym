import { Platform } from 'react-native';
import { GoogleAuthProvider, User, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthUser } from '../store/useAuthStore';

const GOOGLE_WEB_CLIENT_ID = '1082475202315-k7beecp9gfncd1tpnl264u7tt57qifbd.apps.googleusercontent.com';
let isGoogleConfigured = false;
let googleModule: any | null = null;
let googleModuleChecked = false;

function getGoogleSignInModule() {
    if (Platform.OS === 'web') {
        return null;
    }

    if (googleModule) {
        return googleModule;
    }

    if (googleModuleChecked) {
        return null;
    }

    try {
        googleModuleChecked = true;
        googleModule = require('@react-native-google-signin/google-signin');
        return googleModule;
    } catch {
        return null;
    }
}

function mapFirebaseUserToAuthUser(user: User): AuthUser {
    const provider = user.isAnonymous
        ? 'anonymous'
        : user.providerData.some((entry) => entry.providerId === 'google.com')
            ? 'google'
            : 'firebase';

    return {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        picture: user.photoURL,
        isAnonymous: user.isAnonymous,
        provider,
    };
}

export function configureGoogleSignIn() {
    if (isGoogleConfigured) {
        return;
    }

    const mod = getGoogleSignInModule();
    if (!mod?.GoogleSignin) {
        throw new Error('Google login requires a development or production build. It is not available in Expo Go.');
    }

    mod.GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
    });

    isGoogleConfigured = true;
}

export async function signInWithGoogleNative(): Promise<AuthUser | null> {
    if (Platform.OS === 'web') {
        throw new Error('Google sign-in is only available in the native app build.');
    }

    const mod = getGoogleSignInModule();
    if (!mod?.GoogleSignin) {
        throw new Error('Google login requires a development or production build. It is not available in Expo Go.');
    }

    configureGoogleSignIn();

    try {
        await mod.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await mod.GoogleSignin.signIn();

        if (mod.isCancelledResponse(response)) {
            return null;
        }

        if (!mod.isSuccessResponse(response)) {
            throw new Error('Google sign-in did not complete successfully.');
        }

        const idToken = response.data.idToken;
        if (!idToken) {
            throw new Error('Google sign-in did not return an ID token.');
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        return mapFirebaseUserToAuthUser(userCredential.user);
    } catch (error: unknown) {
        if (mod.isErrorWithCode(error)) {
            const googleError = error as { code?: string };
            if (googleError.code === mod.statusCodes.SIGN_IN_CANCELLED) {
                return null;
            }

            if (googleError.code === mod.statusCodes.IN_PROGRESS) {
                throw new Error('Google sign-in is already in progress.');
            }

            if (googleError.code === mod.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                throw new Error('Google Play Services are not available or need an update on this device.');
            }
        }

        throw error instanceof Error ? error : new Error('Google sign-in failed.');
    }
}

export async function signOutGoogleSession() {
    if (Platform.OS === 'web') {
        return;
    }

    const mod = getGoogleSignInModule();
    if (!mod?.GoogleSignin) {
        return;
    }

    configureGoogleSignIn();

    try {
        if (mod.GoogleSignin.hasPreviousSignIn()) {
            await mod.GoogleSignin.signOut();
        }
    } catch (error) {
        console.warn('Google session sign-out failed', error);
    }
}

export function isGoogleAuthAvailable() {
    return Platform.OS !== 'web' && !!getGoogleSignInModule()?.GoogleSignin;
}

export async function signInToFirebaseWithGoogle(
    idToken: string,
    accessToken?: string
): Promise<AuthUser> {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    return mapFirebaseUserToAuthUser(userCredential.user);
}
