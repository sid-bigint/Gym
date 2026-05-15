import { Redirect } from 'expo-router';
import { useUserStore } from '../src/store/useUserStore';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Index() {
    const { user, isLoading: userLoading } = useUserStore();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();

    if (authLoading || userLoading) {
        return null;
    }

    // Not authenticated - go to login
    if (!isAuthenticated) {
        return <Redirect href="/auth/login" />;
    }

    // Authenticated but no user profile - go to onboarding
    if (!user || !user.name || user.name === 'User') {
        return <Redirect href="/onboarding" />;
    }

    // Fully set up - go to main app
    return <Redirect href="/(tabs)" />;
}

