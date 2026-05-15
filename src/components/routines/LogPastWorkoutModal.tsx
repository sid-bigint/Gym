import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Dimensions, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';
import { spacing, borderRadius, shadows } from '../../constants/theme';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, isAfter, startOfDay, subMonths, addMonths } from 'date-fns';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useAlertStore } from '../../store/useAlertStore';
import { ExerciseSelector } from '../ExerciseSelector';
import { Exercise } from '../../types';
import { KeyboardAwareScreen } from '../KeyboardAwareScreen';
import { Button } from '../Button';

const { width } = Dimensions.get('window');

interface LogPastWorkoutModalProps {
    visible: boolean;
    onClose: () => void;
}

interface LogSet {
    id: string;
    exerciseId: number;
    exerciseName: string;
    exerciseImage?: string;
    setNumber: number;
    weight: string;
    reps: string;
    type: string;
}

export function LogPastWorkoutModal({ visible, onClose }: LogPastWorkoutModalProps) {
    const { colors } = useTheme();
    const { exercises, saveWorkoutLog } = useWorkoutStore();
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [durationStr, setDurationStr] = useState('45');
    const [notes, setNotes] = useState('');
    const [workoutName, setWorkoutName] = useState('Manual Entry');
    
    const [activeSets, setActiveSets] = useState<LogSet[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    
    // Get unique exercise IDs currently in the list to pass to the selector
    const initialSelectedIds = useMemo(() => {
        return Array.from(new Set(activeSets.map(s => s.exerciseId)));
    }, [activeSets]);

    const handleSave = async () => {
        if (!workoutName.trim()) return useAlertStore.getState().showAlert("Required", "Please enter a workout name.");
        if (activeSets.length === 0) return useAlertStore.getState().showAlert("Required", "Please add at least one exercise.");

        // Validate
        for (const s of activeSets) {
            // If they left it completely blank, that's fine, it will default to 0. 
            // We just ensure they don't enter invalid strings, but parseInt/parseFloat handles that.
        }

        try {
            const durationSecs = (parseInt(durationStr) || 45) * 60;
            
            const formattedSets = activeSets.map(s => ({
                exerciseId: s.exerciseId,
                weight: parseFloat(s.weight) || 0,
                reps: parseInt(s.reps) || 0,
                type: s.type,
                completed: 1 // Always true for past logs
            }));

            await saveWorkoutLog(null, workoutName, durationSecs, notes, formattedSets, selectedDate);
            useAlertStore.getState().showAlert('Success', 'Past workout logged successfully!');
            onClose();
            
            // Reset state
            setActiveSets([]);
            setWorkoutName('Manual Entry');
            setDurationStr('45');
            setNotes('');
            setStep(1);
        } catch (e) {
            useAlertStore.getState().showAlert('Error', 'Failed to save workout.');
        }
    };

    const handleExerciseSelection = (newExercises: Exercise[]) => {
        // Keep existing sets for exercises that are still selected
        const newExerciseIds = new Set(newExercises.map(e => e.id));
        let nextSets = activeSets.filter(s => newExerciseIds.has(s.exerciseId));
        
        // Add 1 default set for newly selected exercises
        newExercises.forEach(ex => {
            if (!activeSets.some(s => s.exerciseId === ex.id)) {
                nextSets.push({
                    id: Math.random().toString(),
                    exerciseId: ex.id,
                    exerciseName: ex.name,
                    exerciseImage: ex.images?.[0],
                    setNumber: 1,
                    weight: '',
                    reps: '',
                    type: 'Normal'
                });
            }
        });

        // Re-number the sets
        let exCountMap: Record<number, number> = {};
        nextSets = nextSets.map(s => {
            exCountMap[s.exerciseId] = (exCountMap[s.exerciseId] || 0) + 1;
            return { ...s, setNumber: exCountMap[s.exerciseId] };
        });

        setActiveSets(nextSets);
        setShowExerciseSelector(false);
    };

    const addSetToExercise = (exerciseId: number) => {
        const existingSets = activeSets.filter(s => s.exerciseId === exerciseId);
        if (existingSets.length === 0) return;
        
        const lastSet = existingSets[existingSets.length - 1];
        const newSet: LogSet = {
            id: Math.random().toString(),
            exerciseId,
            exerciseName: lastSet.exerciseName,
            exerciseImage: lastSet.exerciseImage,
            setNumber: lastSet.setNumber + 1,
            weight: lastSet.weight, // Copy previous weight
            reps: lastSet.reps, // Copy previous reps
            type: 'Normal'
        };

        // Insert it right after the last set of this exercise
        const insertIndex = activeSets.lastIndexOf(lastSet) + 1;
        const nextSets = [...activeSets];
        nextSets.splice(insertIndex, 0, newSet);
        setActiveSets(nextSets);
    };

    const removeSet = (id: string) => {
        let nextSets = activeSets.filter(s => s.id !== id);
        // Re-number
        let exCountMap: Record<number, number> = {};
        nextSets = nextSets.map(s => {
            exCountMap[s.exerciseId] = (exCountMap[s.exerciseId] || 0) + 1;
            return { ...s, setNumber: exCountMap[s.exerciseId] };
        });
        setActiveSets(nextSets);
    };

    const updateSet = (id: string, field: keyof LogSet, value: string) => {
        setActiveSets(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const getNextType = (currentType: string) => {
        const types = ['Normal', 'Warmup', 'Drop', 'Super', 'Failure'];
        const idx = types.indexOf(currentType || 'Normal');
        return types[(idx + 1) % types.length];
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Warmup': return '#F59E0B';
            case 'Drop': return '#EF4444';
            case 'Super': return '#8B5CF6';
            case 'Failure': return '#10B981';
            default: return 'transparent';
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'Warmup': return 'WARMUP';
            case 'Drop': return 'DROP';
            case 'Super': return 'SUPER';
            case 'Failure': return 'FAILURE';
            default: return 'NORMAL';
        }
    };

    const renderCalendar = () => {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const days = eachDayOfInterval({
          start: startOfWeek(start, { weekStartsOn: 0 }),
          end: endOfWeek(end, { weekStartsOn: 0 })
        });
    
        return (
          <View style={styles.calendarGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
              <Text key={`label-${idx}`} style={[styles.calendarDayLabel, { color: colors.text.tertiary }]}>{d}</Text>
            ))}
            {days.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, selectedDate);
              const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
    
              return (
                <TouchableOpacity
                  key={`day-${idx}`}
                  disabled={isFuture}
                  style={[
                    styles.calendarDay,
                    isSelected && { backgroundColor: colors.accent.primary },
                    isFuture && { opacity: 0.3 }
                  ]}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text style={[
                    styles.calendarDayText,
                    { color: isCurrentMonth ? colors.text.primary : colors.text.disabled },
                    isSelected && { color: 'white' },
                    isFuture && { color: colors.text.disabled }
                  ]}>
                    {format(day, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
    };

    const uniqueExerciseIds = Array.from(new Set(activeSets.map(s => s.exerciseId)));

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
                <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
                    <TouchableOpacity onPress={onClose} style={styles.navBack}>
                        <Ionicons name="close" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Log Past Entry</Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAwareScreen
                    style={styles.container}
                    contentContainerStyle={styles.mainContent}
                    footer={
                        <View style={[styles.footer, { backgroundColor: colors.background.primary, borderTopColor: colors.border.primary }]}>
                            {step === 1 ? (
                                <Button title="Next: Add Exercises" onPress={() => setStep(2)} />
                            ) : (
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <Button title="Back" onPress={() => setStep(1)} style={{ flex: 1, backgroundColor: colors.background.card }} textStyle={{ color: colors.text.primary }} />
                                    <Button title="Save Workout" onPress={handleSave} style={{ flex: 2 }} />
                                </View>
                            )}
                        </View>
                    }
                >
                    {step === 1 && (
                        <View>
                            {/* CALENDAR SECTION */}
                            <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                                <View style={styles.calendarHeader}>
                                    <Text style={[styles.monthText, { color: colors.text.primary }]}>
                                        {format(selectedDate, 'MMMM yyyy')}
                                    </Text>
                                    <View style={{ flexDirection: 'row', gap: 16 }}>
                                        <TouchableOpacity onPress={() => setSelectedDate(subMonths(selectedDate, 1))}>
                                            <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setSelectedDate(addMonths(selectedDate, 1))}>
                                            <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {renderCalendar()}
                            </View>

                            {/* BASIC INFO */}
                            <View style={styles.section}>
                                <View style={styles.row}>
                                    <View style={[styles.formGroup, { flex: 2 }]}>
                                        <Text style={[styles.label, { color: colors.text.secondary }]}>WORKOUT NAME</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.text.primary, backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                                            value={workoutName}
                                            onChangeText={setWorkoutName}
                                            placeholder="e.g., Pull Day"
                                            placeholderTextColor={colors.text.disabled}
                                        />
                                    </View>
                                    <View style={[styles.formGroup, { flex: 1 }]}>
                                        <Text style={[styles.label, { color: colors.text.secondary }]}>MINUTES</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.text.primary, backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                                            value={durationStr}
                                            onChangeText={setDurationStr}
                                            keyboardType="numeric"
                                            placeholder="45"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* NOTES */}
                            <View style={styles.section}>
                                <Text style={[styles.label, { color: colors.text.secondary }]}>NOTES (OPTIONAL)</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text.primary, backgroundColor: colors.background.card, borderColor: colors.border.primary, height: 80, textAlignVertical: 'top' }]}
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    placeholder="How did it feel?"
                                    placeholderTextColor={colors.text.disabled}
                                />
                            </View>
                        </View>
                    )}

                    {step === 2 && (
                        <View>
                            {/* EXERCISES (Active.tsx Style) */}
                            <View style={styles.section}>
                                <Text style={[styles.label, { color: colors.text.secondary, marginBottom: 16 }]}>EXERCISES</Text>

                        {uniqueExerciseIds.map((exId) => {
                            const sets = activeSets.filter(s => s.exerciseId === exId);
                            const exerciseName = sets[0]?.exerciseName || 'Unknown Exercise';

                            return (
                                <View key={exId} style={[styles.exerciseCard, { backgroundColor: colors.background.card, borderRadius: borderRadius.lg }]}>
                                    {/* Exercise Header */}
                                    <View style={[styles.exerciseHeaderContainer, { borderBottomColor: colors.border.secondary }]}>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
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
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.headerAddBtn, { backgroundColor: colors.background.elevated }]}
                                            onPress={() => addSetToExercise(exId)}
                                        >
                                            <Ionicons name="add" size={20} color={colors.accent.primary} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.tableBlock}>
                                        <View style={styles.tableHeader}>
                                            <Text style={[styles.col, { flex: 0.8, color: colors.text.tertiary }]}>Set / Type</Text>
                                            <Text style={[styles.col, { flex: 1, color: colors.text.tertiary }]}>kg</Text>
                                            <Text style={[styles.col, { flex: 1, color: colors.text.tertiary }]}>Reps</Text>
                                            <Text style={[styles.col, { flex: 0.5, color: colors.text.tertiary }]}></Text>
                                        </View>

                                        {sets.map((set) => {
                                            const isSpecial = set.type && set.type !== 'Normal';
                                            const badgeColor = getTypeColor(set.type);

                                            return (
                                                <View key={set.id} style={[
                                                    styles.setRow,
                                                    { backgroundColor: colors.background.primary, borderColor: colors.border.primary }
                                                ]}>
                                                    <TouchableOpacity
                                                        style={[styles.setNumberBtn, { flex: 0.8 }]}
                                                        onPress={() => updateSet(set.id, 'type', getNextType(set.type))}
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
                                                        style={[styles.tableInput, { flex: 1, backgroundColor: colors.background.elevated, color: colors.text.primary, borderColor: colors.border.primary }]}
                                                        keyboardType="numeric"
                                                        placeholder="0"
                                                        placeholderTextColor={colors.text.disabled}
                                                        value={set.weight}
                                                        onChangeText={(v) => updateSet(set.id, 'weight', v)}
                                                    />
                                                    <TextInput
                                                        style={[styles.tableInput, { flex: 1, backgroundColor: colors.background.elevated, color: colors.text.primary, borderColor: colors.border.primary }]}
                                                        keyboardType="numeric"
                                                        placeholder="0"
                                                        placeholderTextColor={colors.text.disabled}
                                                        value={set.reps}
                                                        onChangeText={(v) => updateSet(set.id, 'reps', v)}
                                                    />
                                                    <TouchableOpacity
                                                        style={{ flex: 0.5, alignItems: 'center', justifyContent: 'center' }}
                                                        onPress={() => removeSet(set.id)}
                                                    >
                                                        <Ionicons name="trash-outline" size={20} color={colors.accent.error} />
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
                            onPress={() => setShowExerciseSelector(true)}
                        >
                            <Ionicons name="add" size={24} color={colors.text.inverse} />
                        </TouchableOpacity>
                    </View>
                    </View>
                    )}
                </KeyboardAwareScreen>
            </View>

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
                        initialSelected={initialSelectedIds}
                        buttonLabel="Add Selected"
                    />
                </View>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mainContent: {
        padding: spacing.xl,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 16,
    },
    navBack: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 32,
    },
    row: { flexDirection: 'row', gap: spacing.lg },
    formGroup: { flex: 1 },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        borderRadius: borderRadius.lg,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    card: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.xxl,
        ...shadows.sm,
    },
    
    // Calendar Styles
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    monthText: { fontSize: 16, fontWeight: '700' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calendarDayLabel: {
        width: (width - spacing.xl * 2 - spacing.lg * 2 - 16) / 7,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
    },
    calendarDay: {
        width: (width - spacing.xl * 2 - spacing.lg * 2 - 16) / 7,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        marginBottom: 4,
    },
    calendarDayText: { fontSize: 13, fontWeight: '700' },

    // Exercise Card Styles (from active.tsx)
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
        justifyContent: 'space-between',
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
    headerAddBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tableBlock: {
        paddingHorizontal: spacing.sm,
        paddingBottom: spacing.md,
    },
    tableHeader: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
        paddingHorizontal: 4,
    },
    col: {
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        padding: 4,
        borderRadius: borderRadius.md,
        borderWidth: 1,
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
    tableInput: {
        borderRadius: 6,
        textAlign: 'center',
        paddingVertical: 0,
        height: 32,
        marginHorizontal: 4,
        borderWidth: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    addNewExerciseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 32,
        ...shadows.sm,
    },
    addNewExerciseText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },

    footer: {
        padding: spacing.xl,
        borderTopWidth: 1,
    },
});
