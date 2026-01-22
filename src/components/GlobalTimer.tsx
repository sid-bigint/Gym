import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Animated } from 'react-native';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useTheme } from '../store/useTheme';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function GlobalTimer() {
    const { activeWorkout } = useWorkoutStore();
    const { colors } = useTheme();
    const pathname = usePathname();
    const [elapsedTime, setElapsedTime] = useState('0:00');
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!activeWorkout) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            setElapsedTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeWorkout]);

    // Pulsing animation
    useEffect(() => {
        if (!activeWorkout) return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [activeWorkout]);

    // Don't show on dashboard (route '/') as it has its own active card
    if (!activeWorkout || pathname === '/' || pathname === '/index') return null;

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                style={styles.container}
                onPress={() => router.push('/workout/active')}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={[colors.accent.primary, colors.accent.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                >
                    {/* Animated pulsing indicator */}
                    <View style={styles.pulseContainer}>
                        <Animated.View
                            style={[
                                styles.pulseOuter,
                                {
                                    transform: [{ scale: pulseAnim }],
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [1, 1.3],
                                        outputRange: [0.3, 0]
                                    })
                                }
                            ]}
                        />
                        <View style={styles.pulseInner} />
                    </View>

                    {/* Workout info */}
                    <View style={styles.infoContainer}>
                        <Text style={styles.workoutName} numberOfLines={1}>
                            {activeWorkout.routineName}
                        </Text>
                        <Text style={styles.liveLabel}>LIVE WORKOUT</Text>
                    </View>

                    {/* Timer */}
                    <View style={styles.timerContainer}>
                        <Text style={styles.timer}>{elapsedTime}</Text>
                    </View>

                    {/* Arrow */}
                    <View style={styles.arrowContainer}>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 4,
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    container: {
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        gap: 10,
    },
    pulseContainer: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseOuter: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    pulseInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'white',
    },
    infoContainer: {
        flex: 1,
    },
    workoutName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 1,
    },
    liveLabel: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    timerContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    timer: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
        letterSpacing: 0.5,
    },
    arrowContainer: {
        width: 24,
        alignItems: 'center',
    },
});
