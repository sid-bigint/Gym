import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AuthUser } from '../store/useAuthStore';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Firebase Google OAuth client IDs
const GOOGLE_CLIENT_ID_WEB = '1082475202315-k7beecp9gfncd1tpnl264u7tt57qifbd.apps.googleusercontent.com';

export const googleAuthConfig = {
    webClientId: GOOGLE_CLIENT_ID_WEB,
};

export interface GoogleUserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
    try {
        const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userInfo: GoogleUserInfo = await response.json();
        return userInfo;
    } catch (error) {
        console.error('Error fetching Google user info:', error);
        return null;
    }
}

export function convertGoogleUserToAuthUser(googleUser: GoogleUserInfo): AuthUser {
    return {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name || googleUser.given_name || 'User',
        picture: googleUser.picture,
        provider: 'google',
    };
}

// Hook configuration for Google Auth
export function useGoogleAuthConfig() {
    return Google.useAuthRequest({
        webClientId: GOOGLE_CLIENT_ID_WEB,
    });
}
