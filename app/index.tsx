import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useUserStore } from '../src/store/useUserStore';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Index() {
    const { user, isLoading: userLoading } = useUserStore();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();

    // Show loading while checking auth state
    if (authLoading || userLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' }}>
                <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
        );
    }

    // Not authenticated - go to login
    if (!isAuthenticated) {
        return <Redirect href="/onboarding" />;
    }

    // Authenticated but no user profile - go to onboarding
    if (!user || !user.name || user.name === 'User') {
        return <Redirect href="/onboarding" />;
    }

    // Fully set up - go to main app
    return <Redirect href="/(tabs)" />;
}

