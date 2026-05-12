import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/Button';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useTheme } from '../../src/store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../src/types';
import { spacing, borderRadius } from '../../src/constants/theme';
import { ExerciseSelector } from '../../src/components/ExerciseSelector';
import { ExerciseDetailsModal } from '../../src/components/ExerciseDetailsModal';
import { useAlertStore } from '../../src/store/useAlertStore';
import { KeyboardAwareScreen } from '../../src/components/KeyboardAwareScreen';

export default function CreateRoutineScreen() {
    const { id } = useLocalSearchParams();
    const isEditing = !!id;

    const { loadExercises, createRoutine, updateRoutine, routines } = useWorkoutStore();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [name, setName] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<{ exercise: Exercise, sets: string, reps: string }[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [detailExercise, setDetailExercise] = useState<any>(null);

    useEffect(() => {
        loadExercises();
    }, [loadExercises]);

    useEffect(() => {
        if (!isEditing) return;

        const routine = routines.find(r => r.id === Number(id));
        if (!routine) return;

        setName(routine.name);
        setSelectedExercises(
            (routine.exercises || []).map(re => ({
                exercise: re.exercise,
                sets: String(re.sets || 3),
                reps: String(re.reps || 10)
            }))
        );
    }, [id, isEditing, routines]);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.navigate('/(tabs)/routines');
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return useAlertStore.getState().showAlert("Required", "Please enter a routine name");
        if (selectedExercises.length === 0) return useAlertStore.getState().showAlert("Required", "Please add at least one exercise");

        // Validate Inputs
        for (const ex of selectedExercises) {
            const sets = Number(ex.sets);
            const reps = Number(ex.reps);
            if (!Number.isFinite(sets) || sets < 1) return useAlertStore.getState().showAlert("Invalid Input", `Invalid sets for ${ex.exercise.name}`);
            if (!Number.isFinite(reps) || reps < 1) return useAlertStore.getState().showAlert("Invalid Input", `Invalid reps for ${ex.exercise.name}`);
        }

        const payload = selectedExercises.map(e => ({
            exerciseId: e.exercise.id,
            sets: Number(e.sets),
            reps: Number(e.reps)
        }));

        if (isEditing) {
            await updateRoutine(Number(id), name, payload);
        } else {
            await createRoutine(name, payload);
        }
        handleBack();
    };

    const handleExerciseSelection = (newExercises: Exercise[]) => {
        setSelectedExercises(prev => {
            const previousById = new Map(prev.map(item => [item.exercise.id, item]));

            return newExercises.map(ex => previousById.get(ex.id) ?? {
                exercise: ex,
                sets: '3',
                reps: '10'
            });
        });
        setShowExerciseSelector(false);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <KeyboardAwareScreen
                style={styles.container}
                contentContainerStyle={styles.mainContent}
                footer={
                    <View style={styles.footer}>
                        <Button
                            title={isEditing ? "Update Routine" : "Save Routine"}
                            onPress={handleSave}
                        />
                    </View>
                }
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.navBack} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isEditing ? 'Edit Routine' : 'Create Routine'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>ROUTINE NAME</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Chest & Triceps"
                        placeholderTextColor={colors.text.tertiary}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionLabel}>EXERCISES</Text>
                        <TouchableOpacity onPress={() => setShowExerciseSelector(true)}>
                            <Text style={styles.addExerciseLink}>+ Add</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedExercises.map((item, idx) => (
                        <View key={`${item.exercise.id}-${idx}`} style={styles.exerciseRow}>
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity onPress={() => setDetailExercise(item.exercise)}>
                                    <Text style={styles.rowName}>{idx + 1}. {item.exercise.name}</Text>
                                </TouchableOpacity>
                                <View style={styles.rowConfig}>
                                    <View style={styles.configItem}>
                                        <Text style={styles.configLabel}>Sets</Text>
                                        <TextInput
                                            style={styles.configInput}
                                            keyboardType="numeric"
                                            value={item.sets}
                                            placeholder="3"
                                            placeholderTextColor={colors.text.disabled}
                                            onChangeText={(v) => {
                                                setSelectedExercises(prev => prev.map((e, index) => index === idx ? { ...e, sets: v.replace(/[^0-9]/g, '') } : e));
                                            }}
                                        />
                                    </View>
                                    <View style={styles.configItem}>
                                        <Text style={styles.configLabel}>Reps</Text>
                                        <TextInput
                                            style={styles.configInput}
                                            keyboardType="numeric"
                                            value={item.reps}
                                            placeholder="10"
                                            placeholderTextColor={colors.text.disabled}
                                            onChangeText={(v) => {
                                                setSelectedExercises(prev => prev.map((e, index) => index === idx ? { ...e, reps: v.replace(/[^0-9]/g, '') } : e));
                                            }}
                                        />
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedExercises(prev => prev.filter((_, index) => index !== idx))}>
                                <Ionicons name="trash-outline" size={20} color={colors.accent.error} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {selectedExercises.length === 0 && (
                        <TouchableOpacity style={styles.emptyAddCard} onPress={() => setShowExerciseSelector(true)}>
                            <Ionicons name="add" size={32} color={colors.accent.primary} />
                            <Text style={styles.emptyAddText}>Tap to select exercises</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAwareScreen>

            {/* Exercise Selector Modal */}
            <Modal
                visible={showExerciseSelector}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowExerciseSelector(false)}
            >
                <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
                    <ExerciseSelector
                        onClose={() => setShowExerciseSelector(false)}
                        onSelect={handleExerciseSelection}
                        multiSelect={true}
                        initialSelected={selectedExercises.map(item => item.exercise.id)}
                        buttonLabel="Add Selected"
                        onExerciseLongPress={setDetailExercise}
                    />
                </View>
            </Modal>

            {/* Details Modal */}
            <ExerciseDetailsModal
                visible={!!detailExercise}
                exercise={detailExercise}
                onClose={() => setDetailExercise(null)}
            />
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    mainContent: {
        padding: spacing.xl,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        marginTop: Platform.OS === 'android' ? 40 : 0,
    },
    navBack: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    section: {
        marginBottom: 32,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text.secondary,
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: 16,
        color: colors.text.primary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text.secondary,
        letterSpacing: 1,
    },
    addExerciseLink: {
        color: colors.accent.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    exerciseRow: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.secondary,
    },
    rowName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 8,
    },
    rowConfig: {
        flexDirection: 'row',
        gap: 16,
    },
    configItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    configLabel: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    configInput: {
        backgroundColor: colors.background.elevated,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        color: colors.text.primary,
        width: 60,
        fontSize: 14,
        textAlign: 'center',
    },
    emptyAddCard: {
        borderWidth: 2,
        borderColor: colors.border.secondary,
        borderStyle: 'dashed',
        borderRadius: borderRadius.lg,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
    },
    emptyAddText: {
        color: colors.text.secondary,
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        padding: spacing.xl,
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.primary,
    },
});
