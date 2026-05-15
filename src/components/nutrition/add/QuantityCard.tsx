import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../store/useTheme';
import * as Haptics from 'expo-haptics';

interface QuantityCardProps {
    food: {
        name: string;
        per100g: {
            calories: number;
            protein: number;
            carbs: number;
            fats: number;
        };
        servingOptions?: { label: string; grams: number }[];
    };
    onAdd: (quantity: number, unit: 'g' | 'pc') => void;
    onCancel: () => void;
}

export const QuantityCard: React.FC<QuantityCardProps> = ({ food, onAdd, onCancel }) => {
    const { colors } = useTheme();
    const [quantity, setQuantity] = useState('100');
    const [unit, setUnit] = useState<'g' | 'pc'>('g');

    const hasNosOption = food.servingOptions && food.servingOptions.length > 0;
    const presets = unit === 'g' ? [100, 150, 200, 250] : [1, 2, 3, 4];
    const servingWeight = hasNosOption ? food.servingOptions![0].grams : null;

    const calculateMacros = () => {
        const q = parseFloat(quantity) || 0;
        let multiplier = 0;

        if (unit === 'g') {
            multiplier = q / 100;
        } else {
            if (hasNosOption) {
                multiplier = (q * servingWeight!) / 100;
            } else {
                multiplier = q; // Fallback
            }
        }

        return {
            calories: Math.round(food.per100g.calories * multiplier),
            protein: Math.round(food.per100g.protein * multiplier * 10) / 10,
            carbs: Math.round(food.per100g.carbs * multiplier * 10) / 10,
            fats: Math.round(food.per100g.fats * multiplier * 10) / 10,
        };
    };

    const macros = calculateMacros();

    return (
        <View style={[styles.container, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.foodName, { color: colors.text.primary }]}>{food.name}</Text>
                    <Text style={[styles.baseInfo, { color: colors.text.tertiary }]}>
                        {food.per100g.calories} kcal <Text style={{ fontSize: 10, opacity: 0.6 }}>/ 100g</Text>
                    </Text>
                </View>
                <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color={colors.text.tertiary} />
                </TouchableOpacity>
            </View>

            <View style={styles.unitToggleRow}>
                <View style={[styles.toggleContainer, { backgroundColor: colors.background.secondary }]}>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, unit === 'g' && { backgroundColor: colors.background.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setUnit('g'); setQuantity('100'); }}
                    >
                        <Text style={[styles.toggleText, { color: colors.text.tertiary }, unit === 'g' && { color: colors.accent.primary, fontWeight: 'bold' }]}>GRAMS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, unit === 'pc' && { backgroundColor: colors.background.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setUnit('pc'); setQuantity('1'); }}
                    >
                        <Text style={[styles.toggleText, { color: colors.text.tertiary }, unit === 'pc' && { color: colors.accent.primary, fontWeight: 'bold' }]}>NOS</Text>
                    </TouchableOpacity>
                </View>
                {unit === 'pc' && servingWeight && (
                    <Text style={[styles.servingNote, { color: colors.accent.primary }]}>1 Nos = {servingWeight}g</Text>
                )}
            </View>

            <View style={styles.presetsRow}>
                {presets.map(p => (
                    <TouchableOpacity 
                        key={p} 
                        style={[
                            styles.preset, 
                            { borderColor: colors.border.secondary }, 
                            quantity === p.toString() && { borderColor: colors.accent.primary, backgroundColor: colors.accent.primary + '08' }
                        ]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setQuantity(p.toString()); }}
                    >
                        <Text style={[styles.presetText, { color: colors.text.secondary }, quantity === p.toString() && { color: colors.accent.primary, fontWeight: '700' }]}>
                            {p}{unit === 'g' ? 'g' : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.inputSection}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background.secondary, borderColor: colors.border.secondary }]}>
                    <TextInput 
                        style={[styles.input, { color: colors.text.primary }]}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.text.disabled}
                        selectTextOnFocus
                    />
                    <Text style={[styles.inputUnit, { color: colors.text.tertiary }]}>{unit === 'g' ? 'grams' : 'pieces'}</Text>
                </View>
            </View>

            <View style={[styles.macroGrid, { backgroundColor: colors.background.secondary }]}>
                <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: colors.nutrition.calories }]}>{macros.calories}</Text>
                    <Text style={[styles.macroLabel, { color: colors.text.tertiary }]}>KCAL</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: colors.nutrition.protein }]}>{macros.protein}g</Text>
                    <Text style={[styles.macroLabel, { color: colors.text.tertiary }]}>PRO</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: colors.nutrition.carbs }]}>{macros.carbs}g</Text>
                    <Text style={[styles.macroLabel, { color: colors.text.tertiary }]}>CARB</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: colors.nutrition.fats }]}>{macros.fats}g</Text>
                    <Text style={[styles.macroLabel, { color: colors.text.tertiary }]}>FAT</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.addBtn, { backgroundColor: colors.accent.primary }]}
                onPress={() => onAdd(parseFloat(quantity), unit)}
                activeOpacity={0.8}
            >
                <Text style={[styles.addBtnText, { color: colors.text.inverse }]}>Add to Meal</Text>
                <Ionicons name="add" size={20} color={colors.text.inverse} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 32,
        borderWidth: 1,
        padding: 24,
        width: '100%',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    foodName: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    baseInfo: {
        fontSize: 13,
        marginTop: 4,
        fontWeight: '500',
    },
    closeBtn: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unitToggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 3,
    },
    toggleBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 9,
    },
    toggleText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    servingNote: {
        fontSize: 11,
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    presetsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,
    },
    preset: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    presetText: {
        fontSize: 14,
    },
    inputSection: {
        marginBottom: 24,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 20,
        height: 60,
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
    },
    inputUnit: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.5,
    },
    macroGrid: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 24,
    },
    macroItem: {
        flex: 1,
        alignItems: 'center',
    },
    macroValue: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    macroLabel: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    macroDivider: {
        width: 1,
        height: '40%',
        backgroundColor: 'rgba(0,0,0,0.06)',
        alignSelf: 'center',
    },
    addBtn: {
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addBtnText: {
        fontSize: 17,
        fontWeight: 'bold',
    },
});
