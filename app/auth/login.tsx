import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useAlertStore } from '../../src/store/useAlertStore';
import { LinearGradient } from 'expo-linear-gradient';
import { configureGoogleSignIn, isGoogleAuthAvailable, signInWithGoogleNative } from '../../src/services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const { user, isAuthenticated } = useAuthStore();
    const { updateProfile, tempProfileData, setTempProfileData } = useUserStore();
    const signInAsGuest = useAuthStore((s) => s.signInAsGuest);
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isGoogleReady, setIsGoogleReady] = useState(isGoogleAuthAvailable());

    // Watch for authentication state changes to navigate
    useEffect(() => {
        if (isAuthenticated && user) {
            handlePostLoginNavigation();
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (!isGoogleAuthAvailable()) {
            setIsGoogleReady(false);
            return;
        }

        try {
            configureGoogleSignIn();
            setIsGoogleReady(true);
        } catch (error) {
            console.error('Google Sign-In Setup Error:', error);
            setIsGoogleReady(false);
        }
    }, []);

    const handlePostLoginNavigation = async () => {
        // If we have onboarding data waiting, apply it to the new account
        if (tempProfileData) {
            // Ensure name satisfies Zod schema (min 1 char)
            const safeProfileData = {
                ...tempProfileData,
                name: (tempProfileData.name && tempProfileData.name.trim().length > 0)
                    ? tempProfileData.name
                    : 'Guest User'
            };

            await updateProfile(safeProfileData);
            setTempProfileData(null);
            router.replace('/(tabs)');
        } else {
            // Check if user has a name/profile setups?
            // If new user, create default profile
            // We can optionally check if profile is empty, but for now redirect
            router.replace('/(tabs)');
        }
    };

    const handleGoogleSignIn = async () => {
        if (!isGoogleReady) {
            useAlertStore.getState().showAlert('Build Required', 'Google login requires the installed development or production app build, not Expo Go.');
            return;
        }

        setIsGoogleLoading(true);
        try {
            await signInWithGoogleNative();
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            const message = error instanceof Error ? error.message : 'Google Login Failed. Please try again.';
            useAlertStore.getState().showAlert('Error', message);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setIsGuestLoading(true);
        try {
            await signInAsGuest();
            // useEffect will handle navigation
        } catch (error) {
            console.error('Guest login failed', error);
            useAlertStore.getState().showAlert('Error', 'Could not sign in as guest.');
        } finally {
            setIsGuestLoading(false);
        }
    };

    const isLoading = isGuestLoading || isGoogleLoading;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#000000']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Background Decorations */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="fitness" size={42} color="#fff" />
                    </View>
                    <Text style={styles.title}>GymNative</Text>
                    <Text style={styles.subtitle}>Elevate your fitness journey</Text>
                </View>

                <View style={styles.card}>
                    <TouchableOpacity
                        style={[styles.button, styles.googleBtn]}
                        onPress={handleGoogleSignIn}
                        disabled={isLoading || !isGoogleReady}
                    >
                        {isGoogleLoading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={20} color="#000" />
                                <Text style={styles.googleText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.guestBtn]}
                        onPress={handleGuestLogin}
                        disabled={isLoading}
                    >
                        {isGuestLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.guestText}>Continue as Guest</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>
                    By continuing, you agree to our Terms & Privacy Policy.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    circle1: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#8b5cf6',
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
    circle2: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#ec4899',
        opacity: 0.15,
        transform: [{ scale: 1.5 }],
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 8,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    button: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    googleBtn: {
        backgroundColor: '#fff',
    },
    googleText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    orText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginHorizontal: 16,
        fontWeight: '600',
    },
    guestBtn: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.5)',
        marginBottom: 0,
    },
    guestText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        textAlign: 'center',
        marginTop: 32,
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    },
});
