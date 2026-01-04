import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { Routine, Exercise, WorkoutSet } from '../../src/types';

interface ActiveSet {
    exerciseId: number;
    setNumber: number;
    weight: string;
    reps: string;
    completed: boolean;
    exerciseName?: string;
}

export default function ActiveWorkoutScreen() {
    const { id } = useLocalSearchParams(); // routineId
    const { routines, saveWorkoutLog } = useWorkoutStore();

    const [routine, setRoutine] = useState<Routine | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [activeSets, setActiveSets] = useState<ActiveSet[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Determine routine
        if (id) {
            const loadData = async () => {
                const found = routines.find(r => r.id === Number(id));
                setRoutine(found || null);

                let lastSets: WorkoutSet[] = [];
                if (found) {
                    const lastLog = await useWorkoutStore.getState().getLastWorkoutLog(found.id);
                    if (lastLog && lastLog.sets) {
                        lastSets = lastLog.sets;
                    }
                }

                if (found && found.exercises) {
                    // Pre-fill sets based on routine
                    const initialSets: ActiveSet[] = [];
                    found.exercises.forEach(re => {
                        // Find previous sets for this exercise
                        const prevSetsForEx = lastSets.filter(ls => ls.exerciseId === re.exerciseId);

                        for (let i = 0; i < (re.sets || 3); i++) {
                            // Try to match by index if possible, else take last known weight
                            const prevSet = prevSetsForEx[i] || prevSetsForEx[prevSetsForEx.length - 1];
                            const prevWeight = prevSet ? String(prevSet.weight) : '';
                            const prevReps = prevSet ? String(prevSet.reps) : String(re.reps || 10);

                            initialSets.push({
                                exerciseId: re.exerciseId,
                                setNumber: i + 1,
                                weight: prevWeight,
                                reps: prevReps,
                                completed: false,
                                exerciseName: re.exercise.name
                            });
                        }
                    });
                    setActiveSets(initialSets);
                }
            };
            loadData();
        }

        // Start timer
        timerRef.current = setInterval(() => {
            setElapsedSeconds(s => s + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id, routines]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const toggleSet = (index: number) => {
        const newSets = [...activeSets];
        newSets[index].completed = !newSets[index].completed;
        setActiveSets(newSets);
    };

    const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
        const newSets = [...activeSets];
        newSets[index] = { ...newSets[index], [field]: value };
        setActiveSets(newSets);
    };

    const finishWorkout = async () => {
        Alert.alert(
            "Finish Workout",
            "Are you sure you want to finish?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Finish",
                    onPress: async () => {
                        try {
                            const completedSets = activeSets.filter(s => s.completed);
                            await saveWorkoutLog(
                                routine ? routine.id : null,
                                elapsedSeconds,
                                "Good workout!", // Notes
                                completedSets.map(s => ({
                                    exerciseId: s.exerciseId,
                                    weight: Number(s.weight) || 0,
                                    reps: Number(s.reps) || 0
                                }))
                            );
                            router.back();
                        } catch (e) {
                            Alert.alert("Error", "Failed to save workout");
                        }
                    }
                }
            ]
        );
    };

    if (!routine && id) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff' }}>Loading Routine...</Text>
            </View>
        );
    }

    // Group sets by exercise
    const exercisesInOrder = routine?.exercises.map(re => re.exerciseId) || [];
    // Use a map to preserve order if needed, or just unique
    const uniqueExerciseIds = Array.from(new Set(activeSets.map(s => s.exerciseId)));

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{routine?.name || 'Quick Workout'}</Text>
                    <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
                </View>
                <Button title="Finish" onPress={finishWorkout} style={{ height: 40, minHeight: 40, paddingHorizontal: 16 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {uniqueExerciseIds.map((exId) => {
                    const sets = activeSets.filter(s => s.exerciseId === exId);
                    // Get exercise name from first set
                    const exerciseName = sets[0]?.exerciseName || 'Unknown Exercise';

                    return (
                        <View key={exId} style={styles.exerciseCard}>
                            <Text style={styles.exerciseTitle}>{exerciseName}</Text>

                            <View style={styles.tableHeader}>
                                <Text style={[styles.col, { flex: 0.5 }]}>Set</Text>
                                <Text style={[styles.col, { flex: 1 }]}>kg</Text>
                                <Text style={[styles.col, { flex: 1 }]}>Reps</Text>
                                <Text style={[styles.col, { flex: 0.5 }]}>Done</Text>
                            </View>

                            {sets.map((set, idx) => {
                                // Find global index
                                const globalIndex = activeSets.indexOf(set);
                                return (
                                    <View key={idx} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                                        <Text style={[styles.col, { flex: 0.5, color: '#aaa' }]}>{set.setNumber}</Text>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#555"
                                            value={set.weight}
                                            onChangeText={(v) => updateSet(globalIndex, 'weight', v)}
                                        />
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#555"
                                            value={set.reps}
                                            onChangeText={(v) => updateSet(globalIndex, 'reps', v)}
                                        />
                                        <TouchableOpacity
                                            style={[styles.checkBox, set.completed && styles.checkBoxChecked, { flex: 0.5 }]}
                                            onPress={() => toggleSet(globalIndex)}
                                        >
                                            {set.completed && <Ionicons name="checkmark" size={16} color="#17153B" />}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#17153B',
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2E236C',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    timer: {
        color: '#C8ACD6',
        fontSize: 24,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    content: {
        padding: 20,
        paddingBottom: 50,
    },
    exerciseCard: {
        marginBottom: 24,
    },
    exerciseTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    tableHeader: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    col: {
        color: '#aaa',
        textAlign: 'center',
        fontSize: 12,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#2E236C',
        padding: 8,
        borderRadius: 8,
    },
    setRowCompleted: {
        backgroundColor: '#2E3C2E', // Slight green tint
    },
    input: {
        backgroundColor: '#17153B',
        color: '#fff',
        borderRadius: 6,
        textAlign: 'center',
        paddingVertical: 4,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#433D8B',
    },
    checkBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#17153B',
        borderWidth: 1,
        borderColor: '#433D8B',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    checkBoxChecked: {
        backgroundColor: '#C8ACD6',
        borderColor: '#C8ACD6',
    },
});
