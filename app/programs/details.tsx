import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useTheme } from '../../src/store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { PREDEFINED_BUNDLES } from '../../src/data/exploreBundles';
import { spacing, borderRadius, shadows } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function ProgramDetailsScreen() {
    const { colors } = useTheme();
    const { bundleId } = useLocalSearchParams();
    const { exercises, routines, createRoutine } = useWorkoutStore();
    const [isAdding, setIsAdding] = useState(false);

    // Find the bundle
    const bundle = PREDEFINED_BUNDLES.find(b => b.id === bundleId);

    if (!bundle) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text.primary }}>Program not found.</Text>
            </View>
        );
    }

    const handleAddToLibrary = async () => {
        try {
            setIsAdding(true);
            let addedCount = 0;
            const existingRoutineNames = routines.map(r => r.name.toLowerCase());

            for (const routineTemplate of bundle.routines) {
                // Skip if routine already exists
                if (existingRoutineNames.includes(routineTemplate.name.toLowerCase())) {
                    continue;
                }

                const routineExercises = routineTemplate.exercises.map(te => {
                    const ex = exercises.find(e => e.name.toLowerCase() === te.name.toLowerCase());
                    return {
                        exerciseId: ex ? ex.id : null,
                        sets: te.sets,
                        reps: te.reps
                    };
                }).filter(re => re.exerciseId !== null) as { exerciseId: number; sets: number; reps: number }[];

                if (routineExercises.length > 0) {
                    await createRoutine(routineTemplate.name, routineExercises);
                    addedCount++;
                }
            }

            if (addedCount === 0) {
                alert("You already have this program in your library.");
            } else {
                router.replace('/(tabs)/routines');
                alert(`Successfully added ${bundle.name} to your routines!`);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to add program.");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <Stack.Screen options={{
                headerShown: true,
                headerTitle: '',
                headerTransparent: true,
                headerTintColor: 'white',
                headerBackTitleVisible: false,
            }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <LinearGradient
                        colors={bundle.gradient as any}
                        style={styles.heroGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.heroContent}>
                            <View style={[styles.levelBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={styles.levelText}>{bundle.level}</Text>
                            </View>
                            <Text style={styles.heroTitle}>{bundle.name}</Text>
                            <Text style={styles.heroType}>{bundle.type} Series</Text>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.contentContainer}>
                    {/* Stats Row */}
                    <View style={[styles.statsRow, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                        <View style={styles.statItem}>
                            <Ionicons name="calendar-outline" size={20} color={colors.text.tertiary} />
                            <Text style={[styles.statValue, { color: colors.text.primary }]}>{bundle.routines.length} Days</Text>
                            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Per Rotation</Text>
                        </View>
                        <View style={[styles.dividerVertical, { backgroundColor: colors.border.primary }]} />
                        <View style={styles.statItem}>
                            <Ionicons name="barbell-outline" size={20} color={colors.text.tertiary} />
                            <Text style={[styles.statValue, { color: colors.text.primary }]}>
                                {bundle.routines.reduce((acc, r) => acc + r.exercises.length, 0)}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Total Exercises</Text>
                        </View>
                        <View style={[styles.dividerVertical, { backgroundColor: colors.border.primary }]} />
                        <View style={styles.statItem}>
                            <Ionicons name="body-outline" size={20} color={colors.text.tertiary} />
                            <Text style={[styles.statValue, { color: colors.text.primary }]}>Focus</Text>
                            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>{bundle.muscles[0]}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.text.primary }]}>About this Program</Text>
                        <Text style={[styles.descriptionText, { color: colors.text.secondary }]}>
                            {bundle.description}
                        </Text>
                    </View>

                    {/* Muscle Focus */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.text.primary }]}>Target Muscles</Text>
                        <View style={styles.tagContainer}>
                            {bundle.muscles.map(m => (
                                <View key={m} style={[styles.tag, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                                    <Text style={[styles.tagText, { color: colors.text.secondary }]}>{m}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Routine Breakdown */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.text.primary }]}>Workout Schedule</Text>
                        <View style={{ gap: 12 }}>
                            {bundle.routines.map((routine, index) => (
                                <View key={index} style={[styles.routineCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                                    <View style={styles.routineHeader}>
                                        <View style={[styles.dayBadge, { backgroundColor: colors.accent.primary + '15' }]}>
                                            <Text style={[styles.dayText, { color: colors.accent.primary }]}>Day {index + 1}</Text>
                                        </View>
                                        <Text style={[styles.routineName, { color: colors.text.primary }]}>{routine.name}</Text>
                                    </View>
                                    <View style={styles.exerciseList}>
                                        {routine.exercises.map((ex, i) => (
                                            <Text key={i} style={[styles.exerciseItem, { color: colors.text.secondary }]}>
                                                • {ex.name} <Text style={{ color: colors.text.tertiary }}>({ex.sets} x {ex.reps})</Text>
                                            </Text>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.actionBar, { backgroundColor: colors.background.card, borderTopColor: colors.border.primary }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, { color: colors.text.primary }]}>Ready to start?</Text>
                    <Text style={[styles.actionSubtitle, { color: colors.text.tertiary }]}>{bundle.routines.length} routines will be added</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.accent.primary }]}
                    onPress={handleAddToLibrary}
                    disabled={isAdding}
                >
                    <Text style={styles.addButtonText}>{isAdding ? "Adding..." : "Add to Library"}</Text>
                    <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroContainer: {
        height: 300,
        width: '100%',
    },
    heroGradient: {
        flex: 1,
        padding: spacing.xl,
        justifyContent: 'flex-end',
    },
    heroContent: {
        gap: 8,
    },
    levelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        marginBottom: 4,
    },
    levelText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    heroTitle: {
        color: 'white',
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 38,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    heroType: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        fontWeight: '600',
    },
    contentContainer: {
        padding: spacing.xl,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        backgroundColor: 'transparent', // The background color is handled by the View below if needed, but here we just rely on the gap
        gap: 24,
    },
    statsRow: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    dividerVertical: {
        width: 1,
        height: 30,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    section: {
        gap: 12,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '700',
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    tagText: {
        fontWeight: '600',
        fontSize: 13,
    },
    routineCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    routineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    dayBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dayText: {
        fontWeight: '800',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    routineName: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    exerciseList: {
        gap: 6,
        paddingLeft: 4,
    },
    exerciseItem: {
        fontSize: 13,
        lineHeight: 20,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    actionSubtitle: {
        fontSize: 12,
    },
    addButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    }
});
