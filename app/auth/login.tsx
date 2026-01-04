import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../src/store/useAuthStore';
import { fetchGoogleUserInfo, convertGoogleUserToAuthUser } from '../../src/services/authService';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

import { useUserStore } from '../../src/store/useUserStore';

// ... (keep existing imports)

export default function LoginScreen() {
    const { login } = useAuthStore();
    const { updateProfile, tempProfileData, setTempProfileData } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        // Replace with your actual client IDs from Google Cloud Console
        webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
        androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
        iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    });

    useEffect(() => {
        handleGoogleResponse();
    }, [response]);

    const handleGoogleResponse = async () => {
        if (response?.type === 'success') {
            setIsLoading(true);
            try {
                const { authentication } = response;
                if (authentication?.accessToken) {
                    const userInfo = await fetchGoogleUserInfo(authentication.accessToken);
                    if (userInfo) {
                        const authUser = convertGoogleUserToAuthUser(userInfo);
                        await login(authUser);

                        // Check if we have onboarding data to save
                        if (tempProfileData) {
                            await updateProfile(tempProfileData);
                            setTempProfileData(null); // Clear temp data
                            router.replace('/(tabs)');
                        } else {
                            router.replace('/');
                        }
                    } else {
                        Alert.alert('Error', 'Failed to get user information');
                    }
                }
            } catch (error) {
                console.error('Google auth error:', error);
                Alert.alert('Error', 'Authentication failed. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else if (response?.type === 'error') {
            Alert.alert('Error', response.error?.message || 'Authentication failed');
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await promptAsync();
        } catch (error) {
            console.error('Error starting Google auth:', error);
            Alert.alert('Error', 'Could not start authentication');
        }
    };

    // Guest login
    const handleDemoLogin = async () => {
        setIsLoading(true);
        try {
            // 1. Set Auth State
            await login({
                id: `guest-${Date.now()}`,
                email: '',
                name: '',
                provider: 'email',
            });

            // 2. Check for Onboarding Data
            if (tempProfileData) {
                // We have data from the onboarding quiz, save it to the new guest profile
                await updateProfile(tempProfileData);
                setTempProfileData(null);
                // Go directly to Dashboard
                router.replace('/(tabs)');
            } else {
                // No data, reset profile to force onboarding
                await updateProfile({
                    name: '',
                    age: 25,
                    weight: 70,
                    height: 175,
                    gender: 'male'
                });
                // Go to Onboarding (via Index)
                router.replace('/');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Guest login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <View style={styles.gradientContainer}>
                <View style={[styles.gradientCircle, styles.circle1]} />
                <View style={[styles.gradientCircle, styles.circle2]} />
                <View style={[styles.gradientCircle, styles.circle3]} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="barbell" size={48} color="#8B5CF6" />
                    </View>
                    <Text style={styles.appName}>GymNative</Text>
                    <Text style={styles.tagline}>Your Personal Fitness Companion</Text>
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                    <FeatureItem icon="fitness" text="Track Workouts" />
                    <FeatureItem icon="nutrition" text="Log Nutrition" />
                    <FeatureItem icon="analytics" text="View Progress" />
                </View>

                {/* Auth Buttons */}
                <View style={styles.authSection}>
                    {/* Google Sign In */}
                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleSignIn}
                        disabled={!request || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <View style={styles.googleIconContainer}>
                                    <Text style={styles.googleIcon}>G</Text>
                                </View>
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Demo Login Button */}
                    <TouchableOpacity
                        style={styles.demoButton}
                        onPress={handleDemoLogin}
                        disabled={isLoading}
                    >
                        <Ionicons name="person-outline" size={20} color="#8B5CF6" />
                        <Text style={styles.demoButtonText}>Continue as Guest</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
            </View>
        </View>
    );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
                <Ionicons name={icon as any} size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0F',
    },
    gradientContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    gradientCircle: {
        position: 'absolute',
        borderRadius: 999,
    },
    circle1: {
        width: width * 1.5,
        height: width * 1.5,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        top: -width * 0.5,
        left: -width * 0.25,
    },
    circle2: {
        width: width,
        height: width,
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        bottom: -width * 0.3,
        right: -width * 0.3,
    },
    circle3: {
        width: width * 0.8,
        height: width * 0.8,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        top: height * 0.4,
        left: -width * 0.4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
        justifyContent: 'space-between',
    },
    logoSection: {
        alignItems: 'center',
        marginTop: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    appName: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 8,
    },
    featuresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 40,
    },
    featureItem: {
        alignItems: 'center',
        gap: 8,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    featureText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontWeight: '600',
    },
    authSection: {
        gap: 16,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 12,
    },
    googleIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIcon: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4285F4',
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
    },
    demoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        gap: 10,
    },
    demoButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    footer: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        lineHeight: 18,
    },
});
