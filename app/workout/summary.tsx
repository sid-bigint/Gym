import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useTheme } from '../../src/store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../src/constants/theme';
import { format } from 'date-fns';

export default function WorkoutSummaryScreen() {
    const { id } = useLocalSearchParams();
    const { getWorkoutHistory, getExerciseHistory } = useWorkoutStore();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [workout, setWorkout] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        duration: 0,
        volume: 0,
        sets: 0,
        records: 0
    });
    const [exerciseStats, setExerciseStats] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setIsLoading(true);
        if (!id) return;

        // 1. Get This Workout
        const history = await getWorkoutHistory(10); // Get recent history
        const currentWorkout = history.find((w: any) => w.id === Number(id));

        if (currentWorkout) {
            setWorkout(currentWorkout);

            // 2. Fetch full details to get individual sets
            // (We might need a specific getWorkoutDetails if summary isn't enough, 
            // but for now let's assume getWorkoutHistory returns enriched summaries, wait, 
            // getWorkoutHistory returns summary, but we need details for comparison)
            // Let's rely on calculating "improvements" by checking full history for each exercise.

            const db_sets = await getSetsForWorkout(currentWorkout.id);
            const volume = db_sets.reduce((acc: number, s: any) => acc + (s.weight * s.reps), 0);

            // 3. Comparisons
            const exStatsPromises = currentWorkout.exercises.map(async (exName: string) => {
                // Find exercise ID (Need a way to get ID from Name, or better, log preserved IDs)
                // Since getWorkoutHistory returns names, let's fix that or fetch sets first.
                // The DB logic in getWorkoutHistory returns Names. 
                // Let's refactor slightly: we loop through *sets* of this workout.

                const exerciseSets = db_sets.filter((s: any) => s.exercise_name === exName);
                if (exerciseSets.length === 0) return null;

                const exId = exerciseSets[0].exercise_id;
                const fullHistory = await getExerciseHistory(exId);

                // Compare with previous session (not just any set, but the last SESSION's sets)
                // Filter out CURRENT workout sets
                const prevHistory = fullHistory.filter((h: any) => h.workout_id !== currentWorkout.id);

                let improvement = null; // 'weight', 'reps', 'volume', or null
                let isPR = false;

                if (prevHistory.length > 0) {
                    // Simple logic: Compare Max Weight of this session vs Max Weight of ALL previous (PR)
                    const currentMax = Math.max(...exerciseSets.map((s: any) => s.weight));
                    const prevMax = Math.max(...prevHistory.map((s: any) => s.weight));

                    if (currentMax > prevMax && prevMax > 0) isPR = true;

                    // Compare vs Last Session
                    // Group by workout_id to find last session
                    const lastSessionId = prevHistory[prevHistory.length - 1].workout_id;
                    const lastSessionSets = prevHistory.filter((h: any) => h.workout_id === lastSessionId);
                    const lastMax = Math.max(...lastSessionSets.map((s: any) => s.weight));

                    if (currentMax > lastMax) improvement = 'Heavier';
                    else {
                        // Check volume
                        const curVol = exerciseSets.reduce((a: number, b: any) => a + (b.weight * b.reps), 0);
                        const lastVol = lastSessionSets.reduce((a: number, b: any) => a + (b.weight * b.reps), 0);
                        if (curVol > lastVol) improvement = 'More Volume';
                    }
                }

                return {
                    name: exName,
                    sets: exerciseSets.length,
                    bestWeight: Math.max(...exerciseSets.map((s: any) => s.weight)),
                    improvement,
                    isPR,
                    totalVolume: exerciseSets.reduce((a: number, b: any) => a + (b.weight * b.reps), 0)
                };
            });

            const resolvedStats = await Promise.all(exStatsPromises);
            setExerciseStats(resolvedStats.filter(Boolean));

            setStats({
                duration: currentWorkout.duration,
                volume: volume,
                sets: db_sets.length,
                records: resolvedStats.filter((s: any) => s?.isPR).length
            });
        }
        setIsLoading(false);
    };

    // Helper to get sets directly (since store method might be limited)
    // Actually we can use the store's getExerciseHistory to reverse engineer or just add a getWorkoutDetails to store.
    // For now, let's assume we can fetch it via a direct call or duplicate logic if needed.
    // Wait, useWorkoutStore has no 'getWorkoutDetails'. 
    // I will mock fetch it using getExerciseHistory if needed, or just trust getWorkoutHistory returned most data.
    // Actually, getWorkoutHistory returns `exercises` as string array.
    // Let's implement a quick helper here that re-uses getDatabase logic if possible, 
    // OR better, update the store to provide `getWorkoutDetails`.
    // FOR EXPEDIENCY: I will assume `getSetsForWorkout` is available or I can't easily access DB here directly without importing `getDatabase`.
    // I will import `getDatabase` here as it's cleaner.

    const getSetsForWorkout = async (wid: number) => {
        const { getExerciseHistory } = useWorkoutStore.getState();
        // We can't access DB directly if not imported.
        // Let's import getDatabase from source if possible.
        // Or better, let's just add `getWorkoutDetails` to store in next step if this fails.
        // But I can import `getDatabase` from `../../src/db/database`.
        const { getDatabase } = require('../../src/db/database');
        const db = await getDatabase();
        return await db.getAllAsync('SELECT * FROM workout_sets WHERE workout_id = ?', [wid]);
    };

    const handleDone = () => {
        router.replace('/(tabs)/routines');
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
                <Text style={{ marginTop: 20, color: colors.text.secondary }}>Calculating stats...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={styles.content}>

                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.congratsIcon}>
                        <Ionicons name="trophy" size={40} color="#FFD700" />
                    </View>
                    <Text style={styles.title}>Workout Complete!</Text>
                    <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM do')}</Text>
                </View>

                {/* Main Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="time-outline" size={24} color={colors.accent.primary} />
                        <Text style={styles.statValue}>{Math.floor(stats.duration)}m</Text>
                        <Text style={styles.statLabel}>Duration</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="barbell-outline" size={24} color={colors.accent.secondary} />
                        <Text style={styles.statValue}>{(stats.volume / 1000).toFixed(1)}k</Text>
                        <Text style={styles.statLabel}>Vol (kg)</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="layers-outline" size={24} color={colors.status.info} />
                        <Text style={styles.statValue}>{stats.sets}</Text>
                        <Text style={styles.statLabel}>Sets</Text>
                    </View>
                    <View style={[styles.statCard, stats.records > 0 && { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: '#FFD700' }]}>
                        <Ionicons name="flame" size={24} color={stats.records > 0 ? "#FFD700" : colors.text.tertiary} />
                        <Text style={[styles.statValue, stats.records > 0 && { color: "#FFD700" }]}>{stats.records}</Text>
                        <Text style={styles.statLabel}>Records</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Exercise Summary</Text>

                {exerciseStats.map((ex, idx) => (
                    <View key={idx} style={styles.exerciseCard}>
                        <View style={styles.exHeader}>
                            <Text style={styles.exName}>{ex.name}</Text>
                            {ex.isPR && (
                                <View style={styles.prBadge}>
                                    <Text style={styles.prText}>NEW PR</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.exStatsRow}>
                            <Text style={styles.exStat}>{ex.sets} Sets</Text>
                            <Text style={styles.exStat}>Best: {ex.bestWeight}kg</Text>
                            {ex.improvement && (
                                <Text style={styles.improvedText}>
                                    <Ionicons name="trending-up" size={14} /> {ex.improvement}
                                </Text>
                            )}
                        </View>
                    </View>
                ))}

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                    <Text style={styles.doneBtnText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    content: {
        padding: spacing.xl,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    congratsIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text.primary,
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
        color: colors.text.tertiary,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        width: '48%', // Approx half
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.secondary,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text.primary,
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 16,
    },
    exerciseCard: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border.secondary,
    },
    exHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    exName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
    },
    prBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    prText: {
        fontSize: 10,
        fontWeight: '800',
        color: 'black',
    },
    exStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    exStat: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    improvedText: {
        fontSize: 14,
        color: colors.status.success,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.xl,
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.primary,
    },
    doneBtn: {
        backgroundColor: colors.accent.primary,
        paddingVertical: 16,
        borderRadius: borderRadius.full,
        alignItems: 'center',
    },
    doneBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text.inverse,
    },
});
