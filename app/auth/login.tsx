import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useAlertStore } from '../../src/store/useAlertStore';
import { configureGoogleSignIn, isGoogleAuthAvailable, signInWithGoogleNative } from '../../src/services/authService';
import { CloudSyncService } from '../../src/services/cloudSyncService';

const { width, height } = Dimensions.get('window');

const GREEN = '#22C55E';
const GREEN_DIM = 'rgba(34,197,94,0.18)';
const GREEN_BORDER = 'rgba(34,197,94,0.25)';

export default function LoginScreen() {
    const { user, isAuthenticated } = useAuthStore();
    const { updateProfile, tempProfileData, setTempProfileData } = useUserStore();
    const signInAsGuest = useAuthStore((s) => s.signInAsGuest);
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isGoogleReady, setIsGoogleReady] = useState(false);

    // Animations
    const beamX = useRef(new Animated.Value(-width)).current;
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const cardY = useRef(new Animated.Value(30)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(1)).current;
    const guestArrowX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo pop
        Animated.parallel([
            Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
            Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();

        // Card slide up
        Animated.parallel([
            Animated.timing(cardY, { toValue: 0, duration: 500, delay: 150, useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
        ]).start();

        // Beam loop
        const runBeam = () => {
            beamX.setValue(-width);
            Animated.timing(beamX, { toValue: width, duration: 2800, useNativeDriver: true }).start(({ finished }) => {
                if (finished) setTimeout(runBeam, 1500);
            });
        };
        runBeam();

        // Ring pulse loop
        const ringPulse = Animated.loop(
            Animated.sequence([
                Animated.timing(ringScale, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
                Animated.timing(ringScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        );
        ringPulse.start();

        return () => ringPulse.stop();
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) handlePostLoginNavigation();
    }, [isAuthenticated, user]);

    useEffect(() => {
        try {
            if (!isGoogleAuthAvailable()) { setIsGoogleReady(false); return; }
            configureGoogleSignIn();
            setIsGoogleReady(true);
        } catch (e) {
            setIsGoogleReady(false);
        }
    }, []);

    const handlePostLoginNavigation = async () => {
        if (tempProfileData) {
            const safeProfileData = {
                ...tempProfileData,
                name: tempProfileData.name?.trim() || 'Guest User',
                picture: user?.picture || null,
            };
            await updateProfile(safeProfileData);
            setTempProfileData(null);
            await CloudSyncService.backupNow('google-onboarding-complete');
            router.replace('/(tabs)');
        } else {
            const restored = await CloudSyncService.restoreFromCloudIfLocalEmpty();
            if (restored) await useUserStore.getState().loadUser();
            else await CloudSyncService.backupNow('google-login');
            
            const userState = useUserStore.getState().user;
            if (!userState || !userState.name || userState.name === 'User') {
                router.replace('/onboarding');
            } else {
                if (user && !user.isAnonymous && user.picture) {
                    await useUserStore.getState().updateProfile({ picture: user.picture });
                }
                router.replace('/(tabs)');
            }
        }
    };

    const handleGoogleSignIn = async () => {
        if (!isGoogleReady) {
            useAlertStore.getState().showAlert('Build Required', 'Google login requires the installed build, not Expo Go.');
            return;
        }
        setIsGoogleLoading(true);
        try { await signInWithGoogleNative(); }
        catch (e) {
            useAlertStore.getState().showAlert('Error', e instanceof Error ? e.message : 'Google Login Failed.');
        } finally { setIsGoogleLoading(false); }
    };

    const handleGuestLogin = async () => {
        setIsGuestLoading(true);
        try { await signInAsGuest(); }
        catch (e) { useAlertStore.getState().showAlert('Error', 'Could not sign in as guest.'); }
        finally { setIsGuestLoading(false); }
    };

    const animateGuestIn = () =>
        Animated.timing(guestArrowX, { toValue: 4, duration: 150, useNativeDriver: true }).start();
    const animateGuestOut = () =>
        Animated.timing(guestArrowX, { toValue: 0, duration: 150, useNativeDriver: true }).start();

    const isLoading = isGuestLoading || isGoogleLoading;

    return (
        <View style={s.container}>
            {/* Dark BG */}
            <LinearGradient
                colors={['#080A0C', '#0C0F12', '#080A0C']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Green glow orbs */}
            <View style={s.orb1} />
            <View style={s.orb2} />

            {/* Corner accents */}
            <View style={s.cornerTL} />
            <View style={s.cornerBR} />

            {/* Animated beam */}
            <View style={s.beamTrack} pointerEvents="none">
                <Animated.View style={[s.beam, { transform: [{ translateX: beamX }] }]} />
            </View>

            <View style={s.content}>
                {/* Logo */}
                <Animated.View style={[s.logoWrap, {
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                }]}>
                    <View style={s.iconWrap}>
                        <Animated.View style={[s.iconRing, { transform: [{ scale: ringScale }] }]} />
                        <LinearGradient colors={['#1A1F1A', '#111511']} style={s.iconBox}>
                            {/* Replace with your actual logo Image if needed */}
                            <Ionicons name="flash" size={28} color={GREEN} />
                        </LinearGradient>
                    </View>
                    <Text style={s.logoName}>
                        ATHLE<Text style={{ color: GREEN }}>ATOS</Text>
                    </Text>
                    <Text style={s.logoTag}>TRAIN SMART · STAY CONSISTENT</Text>
                </Animated.View>

                {/* Card */}
                <Animated.View style={[s.card, {
                    opacity: cardOpacity,
                    transform: [{ translateY: cardY }],
                }]}>
                    <Text style={s.cardHeading}>GET STARTED</Text>
                    <Text style={s.cardSub}>Join thousands of athletes levelling up</Text>

                    {/* Feature pills */}
                    <View style={s.pills}>
                        {['Workout Tracking', 'Smart Plans', 'Analytics'].map((p) => (
                            <View key={p} style={s.pill}>
                                <View style={s.pillDot} />
                                <Text style={s.pillText}>{p}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Google button */}
                    <TouchableOpacity
                        style={[s.btn, s.btnGoogle]}
                        onPress={handleGoogleSignIn}
                        disabled={isLoading || !isGoogleReady}
                        activeOpacity={0.88}
                    >
                        {isGoogleLoading ? (
                            <ActivityIndicator color="#111" />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={18} color="#111" />
                                <Text style={s.googleText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={s.divider}>
                        <LinearGradient colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.divLine} />
                        <Text style={s.orText}>OR</Text>
                        <LinearGradient colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.divLine} />
                    </View>

                    {/* Guest button */}
                    <TouchableOpacity
                        style={[s.btn, s.btnGuest]}
                        onPress={handleGuestLogin}
                        onPressIn={animateGuestIn}
                        onPressOut={animateGuestOut}
                        disabled={isLoading}
                        activeOpacity={0.88}
                    >
                        {isGuestLoading ? (
                            <ActivityIndicator color={GREEN} />
                        ) : (
                            <>
                                <Ionicons name="person-outline" size={16} color={GREEN} />
                                <Text style={s.guestText}>Continue as Guest</Text>
                                <Animated.View style={{ transform: [{ translateX: guestArrowX }] }}>
                                    <Ionicons name="arrow-forward" size={14} color={GREEN} />
                                </Animated.View>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Stats strip */}
                    <View style={s.statsRow}>
                        {[['50K+', 'Athletes'], ['2M+', 'Workouts'], ['4.9★', 'Rating']].map(([num, label]) => (
                            <View key={label} style={s.stat}>
                                <Text style={s.statNum}>{num}</Text>
                                <Text style={s.statLabel}>{label}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Footer */}
                <Text style={s.footer}>
                    By continuing you agree to our{' '}
                    <Text style={s.footerLink}>Terms</Text> &{' '}
                    <Text style={s.footerLink}>Privacy Policy</Text>
                </Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080A0C' },
    orb1: {
        position: 'absolute', top: height * 0.05, left: -width * 0.2,
        width: width * 0.55, height: width * 0.55, borderRadius: width * 0.275,
        backgroundColor: GREEN, opacity: 0.07,
    },
    orb2: {
        position: 'absolute', bottom: height * 0.08, right: -width * 0.2,
        width: width * 0.45, height: width * 0.45, borderRadius: width * 0.225,
        backgroundColor: GREEN, opacity: 0.04,
    },
    cornerTL: {
        position: 'absolute', top: 0, left: 0,
        width: 100, height: 100,
        borderTopWidth: 1, borderLeftWidth: 1,
        borderTopColor: GREEN_BORDER, borderLeftColor: GREEN_BORDER,
        borderBottomRightRadius: 80,
    },
    cornerBR: {
        position: 'absolute', bottom: 0, right: 0,
        width: 70, height: 70,
        borderBottomWidth: 1, borderRightWidth: 1,
        borderBottomColor: 'rgba(34,197,94,0.12)', borderRightColor: 'rgba(34,197,94,0.12)',
        borderTopLeftRadius: 60,
    },
    beamTrack: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden',
    },
    beam: {
        width: width * 0.6, height: 2,
        backgroundColor: GREEN, opacity: 0.7,
        shadowColor: GREEN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8,
    },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

    // Logo
    logoWrap: { alignItems: 'center', marginBottom: 36 },
    iconWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    iconRing: {
        position: 'absolute', inset: -8,
        width: 88, height: 88, borderRadius: 28,
        borderWidth: 1, borderColor: GREEN_BORDER,
    },
    iconBox: {
        width: 72, height: 72, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
    },
    logoName: {
        fontWeight: '900', fontSize: 40, color: '#fff',
        letterSpacing: 4, lineHeight: 44,
    },
    logoTag: {
        fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.28)',
        fontWeight: '500', marginTop: 4,
    },

    // Card
    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24, padding: 24,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    cardHeading: {
        fontWeight: '900', fontSize: 22, color: '#fff',
        letterSpacing: 2, marginBottom: 4,
    },
    cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20, fontWeight: '300' },

    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: GREEN_DIM, borderRadius: 100,
        paddingHorizontal: 12, paddingVertical: 5,
        borderWidth: 1, borderColor: GREEN_BORDER,
    },
    pillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GREEN },
    pillText: { fontSize: 11, color: 'rgba(34,197,94,0.75)', fontWeight: '500' },

    btn: {
        height: 52, borderRadius: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    btnGoogle: { backgroundColor: '#fff' },
    googleText: { color: '#111', fontSize: 15, fontWeight: '700' },

    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
    divLine: { flex: 1, height: 1 },
    orText: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.2)', fontWeight: '600' },

    btnGuest: {
        backgroundColor: GREEN_DIM,
        borderWidth: 1, borderColor: GREEN_BORDER,
    },
    guestText: { color: GREEN, fontSize: 15, fontWeight: '600' },

    statsRow: {
        flexDirection: 'row', marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12, overflow: 'hidden',
    },
    stat: {
        flex: 1, alignItems: 'center', paddingVertical: 12,
        borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)',
    },
    statNum: { fontSize: 18, fontWeight: '900', color: GREEN, letterSpacing: 0.5 },
    statLabel: { fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,0.25)', fontWeight: '500', marginTop: 2 },

    footer: { textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.18)', lineHeight: 18 },
    footerLink: { color: 'rgba(34,197,94,0.5)' },
});