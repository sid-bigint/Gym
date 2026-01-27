import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/store/useTheme';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { spacing, borderRadius } from '../../src/constants/theme';
import {
    generateWorkoutProgram,
    GenerateWorkoutParams,
    GeneratedProgram,
} from '../../src/services/aiService';
import { Button } from '../../src/components/Button';
import { useAlertStore } from '../../src/store/useAlertStore';

type SplitType = 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split';
type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands';
type Duration = 30 | 45 | 60 | 75 | 90;
type Experience = 'beginner' | 'intermediate' | 'advanced';
type Goal = 'strength' | 'hypertrophy' | 'endurance' | 'general_fitness';

const SPLIT_OPTIONS: { value: SplitType; label: string; description: string; icon: string }[] = [
    { value: 'push_pull_legs', label: 'Push/Pull/Legs', description: 'Classic 3-way split', icon: 'git-branch-outline' },
    { value: 'upper_lower', label: 'Upper/Lower', description: '2-way body split', icon: 'swap-vertical' },
    { value: 'full_body', label: 'Full Body', description: 'Total body each session', icon: 'body' },
    { value: 'bro_split', label: 'Body Part', description: 'One muscle per day', icon: 'fitness' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; icon: string }[] = [
    { value: 'barbell', label: 'Barbell', icon: 'barbell' },
    { value: 'dumbbell', label: 'Dumbbells', icon: 'barbell-outline' },
    { value: 'cable', label: 'Cables', icon: 'git-pull-request' },
    { value: 'machine', label: 'Machines', icon: 'construct' },
    { value: 'bodyweight', label: 'Bodyweight', icon: 'body-outline' },
    { value: 'kettlebell', label: 'Kettlebell', icon: 'flame-outline' },
    { value: 'bands', label: 'Bands', icon: 'git-network-outline' },
];

const DURATION_OPTIONS: Duration[] = [30, 45, 60, 75, 90];

const EXPERIENCE_OPTIONS: { value: Experience; label: string; color: string }[] = [
    { value: 'beginner', label: 'Beginner', color: '#34C759' },
    { value: 'intermediate', label: 'Intermediate', color: '#FF9500' },
    { value: 'advanced', label: 'Advanced', color: '#FF3B30' },
];

const GOAL_OPTIONS: { value: Goal; label: string; description: string; icon: string }[] = [
    { value: 'strength', label: 'Strength', description: 'Lift heavier weights', icon: 'trophy' },
    { value: 'hypertrophy', label: 'Muscle Growth', description: 'Build more muscle', icon: 'trending-up' },
    { value: 'endurance', label: 'Endurance', description: 'Last longer', icon: 'flash' },
    { value: 'general_fitness', label: 'General Fitness', description: 'Overall health', icon: 'heart' },
];

const DAYS_OPTIONS = [3, 4, 5, 6];

export default function GenerateWorkoutScreen() {
    const { colors } = useTheme();
    const { createRoutine, loadRoutines } = useWorkoutStore();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Form State
    const [splitType, setSplitType] = useState<SplitType>('push_pull_legs');
    const [equipment, setEquipment] = useState<Equipment[]>(['barbell', 'dumbbell']);
    const [duration, setDuration] = useState<Duration>(60);
    const [experience, setExperience] = useState<Experience>('intermediate');
    const [goal, setGoal] = useState<Goal>('hypertrophy');
    const [daysPerWeek, setDaysPerWeek] = useState<number>(4);

    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedProgram, setGeneratedProgram] = useState<GeneratedProgram | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    const toggleEquipment = (item: Equipment) => {
        setEquipment(prev =>
            prev.includes(item)
                ? prev.filter(e => e !== item)
                : [...prev, item]
        );
    };

    const handleGenerate = async () => {
        if (equipment.length === 0) {
            useAlertStore.getState().showAlert('Equipment Required', 'Please select at least one type of equipment.');
            return;
        }

        setIsGenerating(true);

        try {
            const params: GenerateWorkoutParams = {
                splitType,
                equipment,
                duration,
                experience,
                goal,
                daysPerWeek: daysPerWeek as 3 | 4 | 5 | 6,
            };

            const program = await generateWorkoutProgram(params);
            setGeneratedProgram(program);
            setCurrentStep(1); // Move to preview step
        } catch (error) {
            useAlertStore.getState().showAlert('Error', 'Failed to generate workout. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveProgram = async () => {
        if (!generatedProgram) return;

        try {
            const { exercises: dbExercises, addExercise, loadExercises } = useWorkoutStore.getState();

            // First, ensure exercises are loaded
            if (dbExercises.length === 0) {
                await loadExercises();
            }

            const updatedDbExercises = useWorkoutStore.getState().exercises;
            // Encode program name in ID for grouping: ai|Name|Timestamp
            // Sanitize name to remove delimiters that would break parsing
            const sanitizedName = generatedProgram.name.replace(/\|/g, '-');
            const programId = `ai|${sanitizedName}|${Date.now()}`;

            // Process each workout
            for (const workout of generatedProgram.workouts) {
                const mappedExercises: { exerciseId: number; sets: number; reps: number }[] = [];

                for (const ex of workout.exercises) {
                    // Try to find a matching exercise in the database (case-insensitive partial match)
                    let matchedExercise = updatedDbExercises.find(dbEx =>
                        dbEx.name.toLowerCase() === ex.name.toLowerCase()
                    );

                    // If no exact match, try partial match
                    if (!matchedExercise) {
                        matchedExercise = updatedDbExercises.find(dbEx =>
                            dbEx.name.toLowerCase().includes(ex.name.toLowerCase()) ||
                            ex.name.toLowerCase().includes(dbEx.name.toLowerCase())
                        );
                    }

                    // If still no match, create a new custom exercise
                    if (!matchedExercise) {
                        const newExercise = await addExercise({
                            name: ex.name,
                            muscleGroup: ex.muscleGroup,
                            type: 'Gym',
                            instructions: ex.notes ? [ex.notes] : [],
                            images: [],
                        });
                        matchedExercise = newExercise;
                    }

                    mappedExercises.push({
                        exerciseId: matchedExercise.id,
                        sets: ex.sets,
                        reps: parseInt(ex.reps.split('-')[0]) || 10,
                    });
                }

                // Create the routine with mapped exercises
                await createRoutine(workout.name, mappedExercises, programId);
            }

            await loadRoutines();

            await loadRoutines();

            useAlertStore.getState().showAlert(
                '✨ Program Created!',
                `${generatedProgram.name} with ${generatedProgram.workouts.length} workouts has been added to your routines.`,
                [{ text: 'View Routines', style: 'default', onPress: () => router.replace('/(tabs)/routines') }]
            );
        } catch (error) {
            console.error('Failed to save program:', error);
            useAlertStore.getState().showAlert('Error', 'Failed to save program. Please try again.');
        }
    };

    const renderFormStep = () => (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Split Type */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Training Split</Text>
                <Text style={styles.sectionSubtitle}>How do you want to organize your workouts?</Text>
                <View style={styles.optionsGrid}>
                    {SPLIT_OPTIONS.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.splitCard,
                                splitType === option.value && styles.splitCardSelected,
                            ]}
                            onPress={() => setSplitType(option.value)}
                        >
                            <Ionicons
                                name={option.icon as any}
                                size={24}
                                color={splitType === option.value ? colors.accent.primary : colors.text.secondary}
                            />
                            <Text style={[
                                styles.splitLabel,
                                splitType === option.value && { color: colors.accent.primary },
                            ]}>
                                {option.label}
                            </Text>
                            <Text style={styles.splitDescription}>{option.description}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Days Per Week */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Days Per Week</Text>
                <View style={styles.daysRow}>
                    {DAYS_OPTIONS.map(day => (
                        <TouchableOpacity
                            key={day}
                            style={[
                                styles.dayChip,
                                daysPerWeek === day && styles.dayChipSelected,
                            ]}
                            onPress={() => setDaysPerWeek(day)}
                        >
                            <Text style={[
                                styles.dayChipText,
                                daysPerWeek === day && { color: colors.text.inverse },
                            ]}>
                                {day}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Equipment */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Equipment</Text>
                <Text style={styles.sectionSubtitle}>Select all equipment you have access to</Text>
                <View style={styles.equipmentGrid}>
                    {EQUIPMENT_OPTIONS.map(item => (
                        <TouchableOpacity
                            key={item.value}
                            style={[
                                styles.equipmentChip,
                                equipment.includes(item.value) && styles.equipmentChipSelected,
                            ]}
                            onPress={() => toggleEquipment(item.value)}
                        >
                            <Ionicons
                                name={item.icon as any}
                                size={18}
                                color={equipment.includes(item.value) ? colors.text.inverse : colors.text.secondary}
                            />
                            <Text style={[
                                styles.equipmentLabel,
                                equipment.includes(item.value) && { color: colors.text.inverse },
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Duration */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Workout Duration</Text>
                <View style={styles.durationRow}>
                    {DURATION_OPTIONS.map(min => (
                        <TouchableOpacity
                            key={min}
                            style={[
                                styles.durationChip,
                                duration === min && styles.durationChipSelected,
                            ]}
                            onPress={() => setDuration(min)}
                        >
                            <Text style={[
                                styles.durationText,
                                duration === min && { color: colors.text.inverse },
                            ]}>
                                {min}m
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Experience */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience Level</Text>
                <View style={styles.experienceRow}>
                    {EXPERIENCE_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.experienceChip,
                                experience === opt.value && { backgroundColor: opt.color, borderColor: opt.color },
                            ]}
                            onPress={() => setExperience(opt.value)}
                        >
                            <Text style={[
                                styles.experienceText,
                                experience === opt.value && { color: '#fff' },
                            ]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Goal */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Primary Goal</Text>
                <View style={styles.goalGrid}>
                    {GOAL_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.goalCard,
                                goal === opt.value && styles.goalCardSelected,
                            ]}
                            onPress={() => setGoal(opt.value)}
                        >
                            <Ionicons
                                name={opt.icon as any}
                                size={24}
                                color={goal === opt.value ? colors.accent.primary : colors.text.tertiary}
                            />
                            <Text style={[
                                styles.goalLabel,
                                goal === opt.value && { color: colors.accent.primary },
                            ]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Generate Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.generateButton}
                    onPress={handleGenerate}
                    disabled={isGenerating}
                >
                    <LinearGradient
                        colors={[colors.accent.primary, colors.accent.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        {isGenerating ? (
                            <>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.generateButtonText}>Generating...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={20} color="#fff" />
                                <Text style={styles.generateButtonText}>Generate Workout</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderPreviewStep = () => (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {generatedProgram && (
                <>
                    {/* Program Header */}
                    <View style={styles.programHeader}>
                        <Text style={styles.programName}>{generatedProgram.name}</Text>
                        <Text style={styles.programDescription}>{generatedProgram.description}</Text>
                        <View style={styles.programMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar" size={16} color={colors.accent.primary} />
                                <Text style={styles.metaText}>{generatedProgram.daysPerWeek} days/week</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="time" size={16} color={colors.accent.secondary} />
                                <Text style={styles.metaText}>{duration} min sessions</Text>
                            </View>
                        </View>
                    </View>

                    {/* Workouts */}
                    {generatedProgram.workouts.map((workout, index) => (
                        <View key={index} style={styles.workoutCard}>
                            <View style={styles.workoutHeader}>
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>Day {workout.dayNumber}</Text>
                                </View>
                                <Text style={styles.workoutName}>{workout.name}</Text>
                            </View>
                            <Text style={styles.workoutFocus}>{workout.focus}</Text>

                            {workout.exercises.map((ex, exIndex) => (
                                <View key={exIndex} style={styles.exerciseRow}>
                                    <View style={styles.exerciseDot} />
                                    <View style={styles.exerciseInfo}>
                                        <Text style={styles.exerciseName}>{ex.name}</Text>
                                        <Text style={styles.exerciseDetails}>
                                            {ex.sets} sets × {ex.reps} reps • {ex.restSeconds}s rest
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => setCurrentStep(0)}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
                            <Text style={styles.secondaryButtonText}>Modify</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleSaveProgram}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>Save Program</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Ionicons name="sparkles" size={20} color={colors.accent.primary} />
                    <Text style={styles.headerTitle}>AI Workout Generator</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, currentStep >= 0 && styles.stepDotActive]} />
                <View style={[styles.stepLine, currentStep >= 1 && styles.stepLineActive]} />
                <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]} />
            </View>
            <Text style={styles.stepLabel}>
                {currentStep === 0 ? 'Configure Your Program' : 'Review & Save'}
            </Text>

            {/* Content */}
            {currentStep === 0 ? renderFormStep() : renderPreviewStep()}
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'android' ? 50 : 60,
        paddingBottom: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.border.primary,
    },
    stepDotActive: {
        backgroundColor: colors.accent.primary,
    },
    stepLine: {
        width: 60,
        height: 2,
        backgroundColor: colors.border.primary,
        marginHorizontal: 8,
    },
    stepLineActive: {
        backgroundColor: colors.accent.primary,
    },
    stepLabel: {
        textAlign: 'center',
        fontSize: 14,
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: spacing.xl,
    },
    section: {
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: colors.text.tertiary,
        marginBottom: spacing.md,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    splitCard: {
        width: '47%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background.card,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        gap: 8,
    },
    splitCardSelected: {
        borderColor: colors.accent.primary,
        backgroundColor: colors.accent.primary + '10',
    },
    splitLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    splitDescription: {
        fontSize: 11,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
    daysRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dayChip: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.card,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    dayChipSelected: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    dayChipText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
    },
    equipmentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    equipmentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.background.card,
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    equipmentChipSelected: {
        backgroundColor: colors.accent.secondary,
        borderColor: colors.accent.secondary,
    },
    equipmentLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.primary,
    },
    durationRow: {
        flexDirection: 'row',
        gap: 10,
    },
    durationChip: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.card,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    durationChipSelected: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    durationText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.primary,
    },
    experienceRow: {
        flexDirection: 'row',
        gap: 10,
    },
    experienceChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.card,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.border.primary,
    },
    experienceText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.primary,
    },
    goalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    goalCard: {
        width: '47%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background.card,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        gap: 8,
    },
    goalCardSelected: {
        borderColor: colors.accent.primary,
        backgroundColor: colors.accent.primary + '10',
    },
    goalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.primary,
    },
    buttonContainer: {
        paddingVertical: spacing.xl,
        paddingBottom: 100,
    },
    generateButton: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    // Preview Step Styles
    programHeader: {
        marginBottom: spacing.xl,
    },
    programName: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text.primary,
        marginBottom: 8,
    },
    programDescription: {
        fontSize: 14,
        color: colors.text.secondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    programMeta: {
        flexDirection: 'row',
        gap: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    workoutCard: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    workoutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    dayBadge: {
        backgroundColor: colors.accent.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dayBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    workoutName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
    },
    workoutFocus: {
        fontSize: 12,
        color: colors.text.tertiary,
        marginBottom: spacing.md,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    exerciseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent.secondary,
        marginTop: 6,
        marginRight: 10,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 2,
    },
    exerciseDetails: {
        fontSize: 12,
        color: colors.text.tertiary,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: spacing.xl,
        paddingBottom: 100,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background.card,
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.primary,
    },
    primaryButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.accent.primary,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});
