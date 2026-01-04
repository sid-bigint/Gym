import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useTheme } from '../store/useTheme';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../constants/theme';

export function GlobalTimer() {
    const { activeWorkout } = useWorkoutStore();
    const { colors } = useTheme();
    const [elapsedTime, setElapsedTime] = useState('0:00');

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

    if (!activeWorkout) return null;

    return (
        <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
            <TouchableOpacity
                style={[styles.container, { backgroundColor: colors.background.elevated, borderColor: colors.border.accent }]}
                onPress={() => router.push('/workout/active')}
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${colors.accent.primary}33` }]}>
                    <Ionicons name="barbell" size={20} color={colors.accent.primary} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.text.secondary }]} numberOfLines={1}>{activeWorkout.routineName}</Text>
                    <Text style={[styles.timer, { color: colors.accent.secondary }]}>{elapsedTime}</Text>
                </View>
                <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={20} color={colors.accent.secondary} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: spacing.sm,
    },
    container: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        marginHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        ...shadows.md,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    timer: {
        fontSize: 20,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
        letterSpacing: 1,
    },
    chevronContainer: {
        marginLeft: spacing.sm,
    },
});
