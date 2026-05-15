import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../store/useTheme';
import * as Haptics from 'expo-haptics';

interface CustomFoodFormProps {
    onSave: (food: { name: string; calories: number; protein: number; carbs: number; fats: number }) => void;
    onCancel: () => void;
}

export const CustomFoodForm: React.FC<CustomFoodFormProps> = ({ onSave, onCancel }) => {
    const { colors } = useTheme();
    const [form, setForm] = useState({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: ''
    });

    const handleSave = () => {
        if (!form.name || !form.calories) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSave({
            name: form.name,
            calories: parseFloat(form.calories) || 0,
            protein: parseFloat(form.protein) || 0,
            carbs: parseFloat(form.carbs) || 0,
            fats: parseFloat(form.fats) || 0,
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: colors.accent.secondary + '15' }]}>
                    <Ionicons name="add" size={24} color={colors.accent.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: colors.text.primary }]}>Create Custom Food</Text>
                    <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>Define macros per 100g</Text>
                </View>
                <TouchableOpacity onPress={onCancel}>
                    <Ionicons name="close" size={24} color={colors.text.disabled} />
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <Text style={[styles.label, { color: colors.text.secondary }]}>FOOD NAME</Text>
                <TextInput 
                    style={[styles.input, { backgroundColor: colors.background.secondary, color: colors.text.primary }]}
                    placeholder="e.g. Grandma's Apple Pie"
                    placeholderTextColor={colors.text.disabled}
                    value={form.name}
                    onChangeText={t => setForm(f => ({ ...f, name: t }))}
                />

                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>CALORIES</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colors.background.secondary, color: colors.text.primary }]}
                            placeholder="0"
                            keyboardType="numeric"
                            value={form.calories}
                            onChangeText={t => setForm(f => ({ ...f, calories: t }))}
                        />
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>PROTEIN (g)</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colors.background.secondary, color: colors.text.primary }]}
                            placeholder="0"
                            keyboardType="numeric"
                            value={form.protein}
                            onChangeText={t => setForm(f => ({ ...f, protein: t }))}
                        />
                    </View>
                </View>

                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>CARBS (g)</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colors.background.secondary, color: colors.text.primary }]}
                            placeholder="0"
                            keyboardType="numeric"
                            value={form.carbs}
                            onChangeText={t => setForm(f => ({ ...f, carbs: t }))}
                        />
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>FATS (g)</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colors.background.secondary, color: colors.text.primary }]}
                            placeholder="0"
                            keyboardType="numeric"
                            value={form.fats}
                            onChangeText={t => setForm(f => ({ ...f, fats: t }))}
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: colors.accent.secondary }]}
                    onPress={handleSave}
                >
                    <Text style={[styles.saveBtnText, { color: '#fff' }]}>Save & Add to Log</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        marginVertical: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
    },
    gridItem: {
        flex: 1,
    },
    saveBtn: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
