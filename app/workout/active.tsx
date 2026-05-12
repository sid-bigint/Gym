import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Image, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useTheme } from '../../src/store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore } from '../../src/store/useAlertStore';
import { ExerciseDetailsModal } from '../../src/components/ExerciseDetailsModal';
import { ExerciseSelector } from '../../src/components/ExerciseSelector';
import { RestTimerOverlay } from '../../src/components/RestTimerOverlay';
import { spacing, borderRadius } from '../../src/constants/theme';
import { KeyboardAwareScreen } from '../../src/components/KeyboardAwareScreen';
import { KeyboardAwareModal } from '../../src/components/KeyboardAwareModal';
import { Button } from '../../src/components/Button';

export default function ActiveWorkoutScreen() {
    const activeWorkout = useWorkoutStore(state => state.activeWorkout);
    const updateActiveSet = useWorkoutStore(state => state.updateActiveSet);
    const toggleActiveSet = useWorkoutStore(state => state.toggleActiveSet);
    const finishActiveWorkout = useWorkoutStore(state => state.finishActiveWorkout);
    const cancelActiveWorkout = useWorkoutStore(state => state.cancelActiveWorkout);
    const addActiveSet = useWorkoutStore(state => state.addActiveSet);
    const removeActiveSet = useWorkoutStore(state => state.removeActiveSet);
    const exercises = useWorkoutStore(state => state.exercises);
    
    const { colors } = useTheme();
    const [elapsedTime, setElapsedTime] = useState('0:00');
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [detailExercise, setDetailExercise] = useState<any>(null);

    // Rest Timer State
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [restDuration, setRestDuration] = useState(60);

    useEffect(() => {
        if (!activeWorkout) {
            router.back();
            return;
        }

        const interval = setInterval(() => {
            const diff = Date.now() - activeWorkout.startTime;
            const totalSecs = Math.floor(diff / 1000);
            const mins = Math.floor(totalSecs / 60);
            const secs = totalSecs % 60;
            setElapsedTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeWorkout]);

    useEffect(() => {
        if (exercises.length === 0) {
            useWorkoutStore.getState().loadExercises();
        }
    }, []);

    const handleFinish = async () => {
        try {
            await finishActiveWorkout(notes);
            setShowFinishModal(false);
            router.replace('/(tabs)/routines');
        } catch (error) {
            useAlertStore.getState().showAlert("Error", "Failed to save workout session");
        }
    };

    const handleCancel = () => {
        useAlertStore.getState().showAlert(
            "Cancel Workout",
            "Are you sure you want to cancel this workout? All progress will be lost.",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: () => {
                        cancelActiveWorkout();
                        router.back();
                    }
                }
            ]
        );
    };

    const handleAddExercise = (selected: any[]) => {
        selected.forEach(ex => {
            addActiveSet(ex.id, ex.name);
        });
        setShowAddExerciseModal(false);
    };

    if (!activeWorkout) return null;

    const uniqueExerciseIds = Array.from(new Set(activeWorkout.activeSets.map(s => s.exerciseId)));

    return (
        <KeyboardAwareScreen style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <Stack.Screen
                options={{
                    headerTitle: activeWorkout.routineName,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setShowFinishModal(true)} style={styles.finishBtn}>
                            <Text style={styles.finishBtnText}>Finish</Text>
                        </TouchableOpacity>
                    ),
                    headerLeft: () => (
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                            <Ionicons name="close" size={24} color={colors.text.tertiary} />
                        </TouchableOpacity>
                    )
                }}
            />

            <View style={styles.headerInfo}>
                <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={16} color={colors.text.tertiary} />
                    <Text style={[styles.infoText, { color: colors.text.secondary }]}>{elapsedTime}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="barbell-outline" size={16} color={colors.text.tertiary} />
                    <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                        {activeWorkout.activeSets.length} Sets
                    </Text>
                </View>
            </View>

            <View style={styles.workoutContent}>
                {uniqueExerciseIds.map((exId) => {
                    const sets = activeWorkout.activeSets.filter(s => s.exerciseId === exId);
                    const exerciseName = sets[0]?.exerciseName || 'Unknown Exercise';
                    
                    return (
                        <View key={exId} style={[styles.exerciseCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
                            <View style={styles.exerciseHeader}>
                                <TouchableOpacity 
                                    style={styles.exerciseNameRow}
                                    onPress={() => {
                                        const fullEx = exercises.find(e => e.id === exId);
                                        if (fullEx) setDetailExercise(fullEx);
                                    }}
                                >
                                    {sets[0]?.exerciseImage ? (
                                        <Image source={{ uri: sets[0].exerciseImage }} style={styles.exerciseThumb} />
                                    ) : (
                                        <View style={[styles.exerciseThumb, { backgroundColor: colors.background.elevated, alignItems: 'center', justifyContent: 'center' }]}>
                                            <Ionicons name="barbell-outline" size={16} color={colors.text.tertiary} />
                                        </View>
                                    )}
                                    <Text style={[styles.exerciseName, { color: colors.text.primary }]}>{exerciseName}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => addActiveSet(exId, exerciseName)}
                                    style={styles.addSetBtn}
                                >
                                    <Ionicons name="add" size={20} color={colors.accent.primary} />
                                    <Text style={[styles.addSetText, { color: colors.accent.primary }]}>Set</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.setsHeader}>
                                <Text style={[styles.setHeaderText, { flex: 1, color: colors.text.tertiary }]}>SET</Text>
                                <Text style={[styles.setHeaderText, { flex: 2, color: colors.text.tertiary, textAlign: 'center' }]}>WEIGHT</Text>
                                <Text style={[styles.setHeaderText, { flex: 2, color: colors.text.tertiary, textAlign: 'center' }]}>REPS</Text>
                                <View style={{ width: 40 }} />
                            </View>

                            {activeWorkout.activeSets.map((set, globalIndex) => {
                                if (set.exerciseId !== exId) return null;
                                
                                return (
                                    <View key={globalIndex} style={styles.setRow}>
                                        <View style={[styles.setNumberBadge, { backgroundColor: set.completed ? colors.accent.primary : colors.background.elevated }]}>
                                            <Text style={[styles.setNumberText, { color: set.completed ? colors.text.inverse : colors.text.secondary }]}>
                                                {set.setNumber}
                                            </Text>
                                        </View>
                                        
                                        <TextInput
                                            style={[styles.setInput, { flex: 2, color: colors.text.primary, backgroundColor: colors.background.primary }]}
                                            keyboardType="numeric"
                                            value={set.weight}
                                            placeholder="0"
                                            placeholderTextColor={colors.text.disabled}
                                            onChangeText={(val) => updateActiveSet(globalIndex, 'weight', val)}
                                        />
                                        
                                        <TextInput
                                            style={[styles.setInput, { flex: 2, color: colors.text.primary, backgroundColor: colors.background.primary }]}
                                            keyboardType="numeric"
                                            value={set.reps}
                                            placeholder="0"
                                            placeholderTextColor={colors.text.disabled}
                                            onChangeText={(val) => updateActiveSet(globalIndex, 'reps', val)}
                                        />

                                        <TouchableOpacity 
                                            onPress={() => {
                                                toggleActiveSet(globalIndex);
                                                if (!set.completed) {
                                                    // Trigger rest timer
                                                    setRestDuration(60); // Default
                                                    setShowRestTimer(true);
                                                }
                                            }}
                                            style={[styles.checkBtn, { backgroundColor: set.completed ? colors.accent.primary + '20' : 'transparent' }]}
                                        >
                                            <Ionicons 
                                                name={set.completed ? "checkmark-circle" : "ellipse-outline"} 
                                                size={24} 
                                                color={set.completed ? colors.accent.primary : colors.text.disabled} 
                                            />
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            onLongPress={() => removeActiveSet(globalIndex)}
                                            delayLongPress={500}
                                            style={styles.deleteBtn}
                                        >
                                            <Ionicons name="remove-circle-outline" size={20} color={colors.text.disabled} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}

                <TouchableOpacity 
                    style={[styles.addExerciseBtn, { borderColor: colors.accent.primary, borderStyle: 'dashed' }]}
                    onPress={() => setShowAddExerciseModal(true)}
                >
                    <Ionicons name="add" size={24} color={colors.accent.primary} />
                    <Text style={[styles.addExerciseText, { color: colors.accent.primary }]}>Add Exercise</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={showFinishModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFinishModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAwareModal 
                        contentStyle={[styles.modalWrapper, { backgroundColor: colors.background.secondary }]}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Finish Workout</Text>
                            <TouchableOpacity onPress={() => setShowFinishModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalContent}>
                            <Text style={[styles.modalLabel, { color: colors.text.secondary }]}>Workout Notes</Text>
                            <TextInput
                                style={[styles.notesInput, { color: colors.text.primary, backgroundColor: colors.background.primary, borderColor: colors.border.primary }]}
                                placeholder="How did it feel?"
                                placeholderTextColor={colors.text.disabled}
                                multiline
                                value={notes}
                                onChangeText={setNotes}
                            />
                            <Button title="Save Workout" onPress={handleFinish} />
                        </View>
                    </KeyboardAwareModal>
                </View>
            </Modal>

            <Modal visible={showAddExerciseModal} animationType="slide">
                <ExerciseSelector
                    onClose={() => setShowAddExerciseModal(false)}
                    onSelect={handleAddExercise}
                />
            </Modal>

            <ExerciseDetailsModal
                visible={!!detailExercise}
                exercise={detailExercise}
                onClose={() => setDetailExercise(null)}
            />

            <RestTimerOverlay
                visible={showRestTimer}
                duration={restDuration}
                onClose={() => setShowRestTimer(false)}
                onAddSeconds={(secs) => setRestDuration(prev => prev + secs)}
            />
        </KeyboardAwareScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    finishBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    finishBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    cancelBtn: {
        padding: 4,
    },
    headerInfo: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    workoutContent: {
        padding: spacing.lg,
        gap: spacing.lg,
    },
    exerciseCard: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        padding: spacing.md,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    exerciseNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    exerciseThumb: {
        width: 36,
        height: 36,
        borderRadius: 8,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '800',
        flex: 1,
    },
    addSetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    addSetText: {
        fontSize: 14,
        fontWeight: '700',
    },
    setsHeader: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    setHeaderText: {
        fontSize: 11,
        fontWeight: '800',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    setNumberBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setNumberText: {
        fontSize: 12,
        fontWeight: '800',
    },
    setInput: {
        height: 36,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '700',
    },
    checkBtn: {
        width: 40,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    deleteBtn: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addExerciseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        gap: 8,
        marginTop: spacing.md,
    },
    addExerciseText: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalContent: {
        gap: spacing.lg,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    notesInput: {
        height: 100,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        padding: spacing.md,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    modalCancel: {
        alignItems: 'center',
        padding: spacing.sm,
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalWrapper: {
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
});
