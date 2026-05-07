import { GoogleSignin, isCancelledResponse, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { GoogleAuthProvider, User, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthUser } from '../store/useAuthStore';

const GOOGLE_WEB_CLIENT_ID = '1082475202315-k7beecp9gfncd1tpnl264u7tt57qifbd.apps.googleusercontent.com';
let isGoogleConfigured = false;

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

    GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
    });

    isGoogleConfigured = true;
}

export async function signInWithGoogleNative(): Promise<AuthUser | null> {
    if (Platform.OS === 'web') {
        throw new Error('Google sign-in is only available in the native app build.');
    }

    configureGoogleSignIn();

    try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();

        if (isCancelledResponse(response)) {
            return null;
        }

        if (!isSuccessResponse(response)) {
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
        if (isErrorWithCode(error)) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                return null;
            }

            if (error.code === statusCodes.IN_PROGRESS) {
                throw new Error('Google sign-in is already in progress.');
            }

            if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
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

    configureGoogleSignIn();

    try {
        if (GoogleSignin.hasPreviousSignIn()) {
            await GoogleSignin.signOut();
        }
    } catch (error) {
        console.warn('Google session sign-out failed', error);
    }
}

export function isGoogleAuthAvailable() {
    return Platform.OS !== 'web';
}

export async function signInToFirebaseWithGoogle(
    idToken: string,
    accessToken?: string
): Promise<AuthUser> {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    return mapFirebaseUserToAuthUser(userCredential.user);
}
