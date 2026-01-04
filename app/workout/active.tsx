import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useTheme } from '../../src/store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { ExerciseDetailsModal } from '../../src/components/ExerciseDetailsModal';
import { ExerciseSelector } from '../../src/components/ExerciseSelector';
import { spacing, borderRadius } from '../../src/constants/theme';

export default function ActiveWorkoutScreen() {
    const { activeWorkout, updateActiveSet, toggleActiveSet, finishActiveWorkout, cancelActiveWorkout, addActiveSet, removeActiveSet, exercises } = useWorkoutStore();
    const { colors } = useTheme();
    const [elapsedTime, setElapsedTime] = useState('0:00');
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [detailExercise, setDetailExercise] = useState<any>(null);

    useEffect(() => {
        if (!activeWorkout) {
            router.back();
            return;
        }

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            setElapsedTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeWorkout]);

    // Ensure exercises are loaded to enable details lookup
    useEffect(() => {
        if (exercises.length === 0) {
            useWorkoutStore.getState().loadExercises();
        }
    }, []);

    if (!activeWorkout) {
        return (
            <View style={styles.container}>
                <Text style={{ color: colors.text.primary }}>No active workout</Text>
            </View>
        );
    }

    const onFinishPress = () => {
        setShowFinishModal(true);
    };

    const confirmFinish = async () => {
        try {
            const workoutId = await finishActiveWorkout(notes);
            setShowFinishModal(false);
            if (workoutId) {
                router.replace({ pathname: '/workout/summary', params: { id: workoutId } });
            } else {
                router.replace('/(tabs)/routines');
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to save workout");
        }
    };

    const handleCancel = () => {
        Alert.alert(
            "Cancel Workout",
            "Are you sure? Progress will be lost.",
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

    const getNextType = (currentType?: string) => {
        const types = ['Normal', 'Warmup', 'Drop', 'Super', 'Failure'];
        const idx = types.indexOf(currentType || 'Normal');
        return types[(idx + 1) % types.length];
    };

    const getTypeColor = (type?: string) => {
        switch (type) {
            case 'Warmup': return '#F59E0B'; // Amber
            case 'Drop': return '#EF4444'; // Red
            case 'Super': return '#8B5CF6'; // Violet
            case 'Failure': return '#10B981'; // Green
            default: return 'transparent';
        }
    };

    const getTypeName = (type?: string) => {
        switch (type) {
            case 'Warmup': return 'WARMUP';
            case 'Drop': return 'DROP';
            case 'Super': return 'SUPER';
            case 'Failure': return 'FAILURE';
            default: return 'NORMAL';
        }
    };

    const uniqueExerciseIds = Array.from(new Set(activeWorkout.activeSets.map(s => s.exerciseId)));

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{activeWorkout.routineName}</Text>
                    <Text style={[styles.timer, { color: colors.accent.secondary }]}>{elapsedTime}</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={handleCancel} style={[styles.cancelButton, { backgroundColor: colors.background.elevated, marginRight: 12 }]}>
                        <Ionicons name="close" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onFinishPress} style={{ padding: 8 }}>
                        <Text style={{ color: colors.accent.primary, fontSize: 17, fontWeight: 'bold' }}>Finish</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {uniqueExerciseIds.map((exId) => {
                    const sets = activeWorkout.activeSets.filter(s => s.exerciseId === exId);
                    const exerciseName = sets[0]?.exerciseName || 'Unknown Exercise';

                    return (
                        <View key={exId} style={[styles.exerciseCard, { backgroundColor: colors.background.card, borderRadius: borderRadius.lg }]}>
                            {/* Exercise Header */}
                            <View style={[styles.exerciseHeaderContainer, { borderBottomColor: colors.border.secondary }]}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                    onPress={() => {
                                        const fullEx = exercises.find(e => e.id === exId);
                                        if (fullEx) setDetailExercise(fullEx);
                                    }}
                                >
                                    {sets[0]?.exerciseImage ? (
                                        <Image
                                            source={{ uri: sets[0].exerciseImage }}
                                            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                                        />
                                    ) : (
                                        <View style={[styles.headerBar, { backgroundColor: colors.accent.primary }]} />
                                    )}
                                    <View style={styles.exerciseHeaderContent}>
                                        <Text style={[styles.exerciseTitle, { color: colors.text.primary }]}>{exerciseName}</Text>
                                        <View style={styles.detailsHint}>
                                            <Ionicons name="information-circle-outline" size={14} color={colors.text.tertiary} />
                                            <Text style={{ fontSize: 10, color: colors.text.tertiary, marginLeft: 4 }}>Tap for info</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.headerAddBtn, { backgroundColor: colors.background.elevated }]}
                                    onPress={() => addActiveSet(exId, exerciseName)}
                                >
                                    <Ionicons name="add" size={20} color={colors.accent.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.tableBlock}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.col, { flex: 0.8, color: colors.text.tertiary }]}>Set / Type</Text>
                                    <Text style={[styles.col, { flex: 1, color: colors.text.tertiary }]}>kg</Text>
                                    <Text style={[styles.col, { flex: 1, color: colors.text.tertiary }]}>Reps</Text>
                                    <Text style={[styles.col, { flex: 1, color: colors.text.tertiary }]}>Status</Text>
                                </View>

                                {sets.map((set, idx) => {
                                    const globalIndex = activeWorkout.activeSets.indexOf(set);
                                    const isSpecial = set.type && set.type !== 'Normal';
                                    const badgeColor = getTypeColor(set.type);

                                    return (
                                        <View key={idx} style={[
                                            styles.setRow,
                                            { backgroundColor: colors.background.primary, borderColor: colors.border.primary },
                                            set.completed && { backgroundColor: 'rgba(52, 199, 89, 0.1)', borderColor: colors.status.completed }
                                        ]}>
                                            <TouchableOpacity
                                                style={[styles.setNumberBtn, { flex: 0.8 }]}
                                                onPress={() => updateActiveSet(globalIndex, 'type', getNextType(set.type))}
                                                onLongPress={() => {
                                                    Alert.alert('Delete Set', `Delete Set ${set.setNumber}?`, [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Delete', style: 'destructive', onPress: () => removeActiveSet(globalIndex) }
                                                    ]);
                                                }}
                                            >
                                                <Text style={[styles.setNumberText, { color: colors.text.primary }]}>{set.setNumber}</Text>
                                                {isSpecial ? (
                                                    <View style={[styles.setTypeBadge, { backgroundColor: badgeColor }]}>
                                                        <Text style={styles.setTypeText}>{getTypeName(set.type)}</Text>
                                                    </View>
                                                ) : (
                                                    <Text style={{ fontSize: 10, color: colors.text.tertiary, marginTop: 2 }}>NORMAL</Text>
                                                )}
                                            </TouchableOpacity>

                                            <TextInput
                                                style={[styles.input, { flex: 1, backgroundColor: colors.background.elevated, color: colors.text.primary, borderColor: colors.border.primary }]}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor={colors.text.disabled}
                                                value={set.weight}
                                                onChangeText={(v) => updateActiveSet(globalIndex, 'weight', v)}
                                            />
                                            <TextInput
                                                style={[styles.input, { flex: 1, backgroundColor: colors.background.elevated, color: colors.text.primary, borderColor: colors.border.primary }]}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor={colors.text.disabled}
                                                value={set.reps}
                                                onChangeText={(v) => updateActiveSet(globalIndex, 'reps', v)}
                                            />
                                            <TouchableOpacity
                                                style={[
                                                    styles.finishSetButton,
                                                    set.completed ? { backgroundColor: colors.status.completed, borderColor: colors.status.completed } : { backgroundColor: colors.background.elevated, borderColor: colors.border.primary }
                                                ]}
                                                onPress={() => toggleActiveSet(globalIndex)}
                                            >
                                                {set.completed ? (
                                                    <Ionicons name="checkmark" size={20} color={colors.text.inverse} />
                                                ) : (
                                                    <Text style={[styles.finishSetText, { color: colors.text.primary }]}>Finish</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}

                <TouchableOpacity
                    style={[styles.addNewExerciseBtn, { backgroundColor: colors.accent.primary }]}
                    onPress={() => setShowAddExerciseModal(true)}
                >
                    <Ionicons name="add" size={24} color={colors.text.inverse} />
                    <Text style={[styles.addNewExerciseText, { color: colors.text.inverse }]}>Add Exercise</Text>
                </TouchableOpacity>
            </ScrollView>

            <ExerciseDetailsModal
                visible={!!detailExercise}
                exercise={detailExercise}
                onClose={() => setDetailExercise(null)}
            />

            {/* Add Exercise Modal */}
            <Modal
                visible={showAddExerciseModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddExerciseModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
                    <ExerciseSelector
                        onClose={() => setShowAddExerciseModal(false)}
                        onSelect={(selected) => {
                            selected.forEach(ex => {
                                addActiveSet(ex.id, ex.name);
                            });
                            setShowAddExerciseModal(false);
                        }}
                        multiSelect={true}
                        buttonLabel="Add to Workout"
                        onExerciseLongPress={setDetailExercise}
                    />
                </View>
            </Modal>

            {/* Finish Workout Modal */}
            <Modal
                visible={showFinishModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowFinishModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.confirmModal, { backgroundColor: colors.background.elevated }]}>
                        <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>Finish Workout</Text>
                        <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
                            Great job! Add any notes for this session?
                        </Text>

                        <TextInput
                            style={[
                                styles.notesInput,
                                {
                                    backgroundColor: colors.background.primary,
                                    color: colors.text.primary,
                                    borderColor: colors.border.primary
                                }
                            ]}
                            placeholder="Workout notes (optional)..."
                            placeholderTextColor={colors.text.disabled}
                            multiline
                            numberOfLines={3}
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.background.card }]}
                                onPress={() => setShowFinishModal(false)}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.accent.primary }]}
                                onPress={confirmFinish}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>Finish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
        borderBottomWidth: 1,
    },
    input: {
        borderRadius: 6,
        textAlign: 'center',
        paddingVertical: 0,
        height: 32, // Smaller height
        marginHorizontal: 4,
        borderWidth: 1,
        fontSize: 14, // Smaller font
        fontWeight: '600',
        textAlignVertical: 'center',
    },
    checkBox: {
        width: 32,
        height: 32,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8, // Less margin
        padding: 4, // Less padding
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    col: {
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
    },
    timer: {
        fontSize: 32,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
        letterSpacing: -1,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        opacity: 0.8,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cancelButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: spacing.xl,
        paddingBottom: 50,
    },
    exerciseCard: {
        marginBottom: spacing.xxl,
        overflow: 'hidden',
    },
    exerciseHeaderContainer: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        marginBottom: spacing.md,
        alignItems: 'center',
    },
    headerBar: {
        width: 4,
        height: 32,
        borderRadius: 2,
        marginRight: spacing.md,
    },
    exerciseHeaderContent: {
        flex: 1,
    },
    exerciseTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    detailsHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    tableBlock: {
        paddingHorizontal: spacing.sm,
        paddingBottom: spacing.md,
    },
    finishSetButton: {
        flex: 1,
        height: 32, // Smaller height
        marginHorizontal: 4,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    finishSetText: {
        fontSize: 11,
        fontWeight: '700',
    },
    tableHeader: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
        paddingHorizontal: 4,
    },
    // ... modal styles ...
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    confirmModal: {
        width: '100%',
        padding: spacing.xl,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.sm,
    },
    confirmText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 20,
    },
    notesInput: {
        width: '100%',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginBottom: spacing.xl,
        textAlignVertical: 'top',
        minHeight: 80,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerAddBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setNumberBtn: {
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setNumberText: {
        fontSize: 14,
        fontWeight: '700',
    },
    setTypeBadge: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
    },
    setTypeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFF',
        textTransform: 'uppercase',
    },
    addNewExerciseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addNewExerciseText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
