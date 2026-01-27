import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTheme } from '../store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { spacing, borderRadius, shadows } from '../constants/theme';
import { useWorkoutStore } from '../store/useWorkoutStore';

interface CreateExerciseModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: (exercise: any) => void;
}

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio/Full Body", "Mobility/Rehab"];
const EXERCISE_TYPES = ["Gym", "Calisthenics", "Home", "Yoga", "Cardio", "Mobility", "General"];

export const CreateExerciseModal = ({ visible, onClose, onCreated }: CreateExerciseModalProps) => {
    const { colors } = useTheme();
    const { addExercise } = useWorkoutStore();

    const [name, setName] = useState('');
    const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
    const [type, setType] = useState(EXERCISE_TYPES[0]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Please enter an exercise name");
            return;
        }

        setIsLoading(true);
        try {
            const newEx = await addExercise({
                name: name.trim(),
                muscleGroup,
                type,
                instructions: [], // Custom exercises start with no instructions
                images: []
            });
            setName(''); // Reset
            onCreated(newEx);
            onClose();
        } catch (e) {
            Alert.alert("Error", "Failed to create exercise");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={[styles.container, { backgroundColor: colors.background.primary }]}
            >
                <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
                    <Text style={[styles.title, { color: colors.text.primary }]}>Create Exercise</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    {/* Name Input */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Exercise Name</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.background.elevated,
                                color: colors.text.primary,
                                borderColor: colors.border.primary
                            }]}
                            placeholder="e.g. Incline Bench Press"
                            placeholderTextColor={colors.text.disabled}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
                    </View>

                    {/* Muscle Group Selector */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Muscle Group</Text>
                        <View style={styles.chipContainer}>
                            {MUSCLE_GROUPS.map(mg => (
                                <TouchableOpacity
                                    key={mg}
                                    style={[
                                        styles.chip,
                                        { borderColor: colors.border.primary },
                                        muscleGroup === mg && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                                    ]}
                                    onPress={() => setMuscleGroup(mg)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: muscleGroup === mg ? 'white' : colors.text.primary }
                                    ]}>{mg}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Type Selector */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Exercise Type</Text>
                        <View style={styles.chipContainer}>
                            {EXERCISE_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.chip,
                                        { borderColor: colors.border.primary },
                                        type === t && { backgroundColor: colors.accent.secondary, borderColor: colors.accent.secondary }
                                    ]}
                                    onPress={() => setType(t)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: type === t ? 'white' : colors.text.primary }
                                    ]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                </ScrollView>

                <View style={[styles.footer, { borderTopColor: colors.border.primary, backgroundColor: colors.background.primary }]}>
                    <Button
                        title={isLoading ? "Creating..." : "Create Exercise"}
                        onPress={handleCreate}
                        disabled={isLoading}
                    />
                </View>

            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: spacing.lg,
    },
    formGroup: {
        marginBottom: spacing.xl,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        height: 50,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        fontSize: 16,
        borderWidth: 1,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        padding: spacing.xl,
        paddingBottom: spacing.xxl, // Safe area
        borderTopWidth: 1,
    },
});
