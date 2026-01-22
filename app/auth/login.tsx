import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';

const { width, height } = Dimensions.get('window');

import { useUserStore } from '../../src/store/useUserStore';

// Try to import Google Sign-In (only works in development builds, not Expo Go)
let GoogleSignin: any = null;
let statusCodes: any = null;
let isGoogleSignInAvailable = false;

try {
    const googleSignInModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignInModule.GoogleSignin;
    statusCodes = googleSignInModule.statusCodes;
    isGoogleSignInAvailable = true;

    // Configure Google Sign-In
    GoogleSignin.configure({
        webClientId: '1082475202315-k7beecp9gfncd1tpnl264u7tt57qifbd.apps.googleusercontent.com',
        offlineAccess: true,
    });
} catch (e) {
    console.log('Google Sign-In not available (Expo Go mode)');
}

export default function LoginScreen() {
    const { login } = useAuthStore();
    const { updateProfile, tempProfileData, setTempProfileData } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);

    // Apple Login Handler
    const handleAppleLogin = async () => {
        Alert.alert('Notice', 'Apple Login is currently disabled for Android build stability.');
        /* 
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            // Signed in
            console.log(credential);
            Alert.alert('Success', 'Apple Login Successful (Mock Implementation)');
            // TODO: Process the actual Apple credential
        } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
                // handle that the user canceled the sign-in flow
            } else {
                Alert.alert('Error', 'Apple Sign-In failed');
            }
        }
        */
    };

    // Phone Login Handler
    const handlePhoneLogin = async () => {
        // Navigate to phone login screen or show modal
        Alert.alert('Notice', 'Phone Login implementation pending');
    };

    // Native Google Sign-In Handler
    const handleGoogleSignIn = async () => {
        // Check if Google Sign-In is available (not in Expo Go)
        if (!isGoogleSignInAvailable || !GoogleSignin) {
            Alert.alert(
                'Not Available',
                'Google Sign-In requires a development build. Please use "Continue as Guest" in Expo Go, or build the app with EAS to use Google Sign-In.'
            );
            return;
        }

        setIsLoading(true);
        try {
            // Check if device supports Google Play Services
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Sign in
            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data) {
                const { user } = userInfo.data;

                // Create auth user object
                const authUser = {
                    id: user.id,
                    email: user.email,
                    name: user.name || '',
                    photo: user.photo || undefined,
                    provider: 'google' as const,
                };

                // Login and navigate
                await login(authUser);

                if (tempProfileData) {
                    await updateProfile(tempProfileData);
                    setTempProfileData(null);
                    router.replace('/(tabs)');
                } else {
                    router.replace('/');
                }
            }
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);

            if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
                // User cancelled the sign-in
                console.log('Sign in cancelled');
            } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('Notice', 'Sign in already in progress');
            } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Google Play Services not available');
            } else {
                Alert.alert('Error', 'Google Sign-In failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
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
            {/* ... other UI ... */}
            <View style={styles.content}>
                {/* ... logo ... */}
                <View style={styles.logoSection}>
                    {/* ... */}
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
                        disabled={isLoading}
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

                    {/* Apple Sign In (iOS only) - COMMENTED OUT FOR ANDROID BUILD FIX
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            style={styles.appleButton}
                            onPress={handleAppleLogin}
                            disabled={isLoading}
                        >
                            <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                            <Text style={styles.appleButtonText}>Continue with Apple</Text>
                        </TouchableOpacity>
                    )}
                    */}

                    {/* Phone Sign In */}


                    {/* Phone Sign In */}
                    <TouchableOpacity
                        style={styles.phoneButton}
                        onPress={handlePhoneLogin}
                        disabled={isLoading}
                    >
                        <Ionicons name="call" size={20} color="#FFFFFF" />
                        <Text style={styles.phoneButtonText}>Continue with Phone</Text>
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
    appleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 12,
    },
    appleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    phoneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 12,
    },
    phoneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
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
