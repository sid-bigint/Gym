import React, { useState, useEffect, useMemo } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/useTheme';
import { RecentFood } from '../../store/useNutritionStore';
import { getMealTypeByTime } from '../../utils/nutritionUtils';

interface QuickQuantityModalProps {
    visible: boolean;
    food: RecentFood | null;
    onClose: () => void;
    onAdd: (quantity: number, unit: 'grams' | 'servings', mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

export const QuickQuantityModal: React.FC<QuickQuantityModalProps> = ({ visible, food, onClose, onAdd }) => {
    const { colors } = useTheme();
    const [quantity, setQuantity] = useState('100');
    const [unit, setUnit] = useState<'grams' | 'servings'>('grams');
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');
    const [activePreset, setActivePreset] = useState<number | null>(null);

    useEffect(() => {
        if (visible) {
            setQuantity('100');
            setUnit('grams');
            setMealType(getMealTypeByTime());
            setActivePreset(null);
        }
    }, [visible]);

    const presets = useMemo(() => {
        if (!food?.servingSize) return [];
        const base = food.servingSize;
        const unitLabel = food.servingUnit || 'Nos';
        return [
            { label: `0.5 ${unitLabel}`, value: base * 0.5 },
            { label: `1 ${unitLabel}`, value: base },
            { label: `1.5 ${unitLabel}`, value: base * 1.5 },
            { label: `2 ${unitLabel}`, value: base * 2 },
        ];
    }, [food]);

    if (!food) return null;

    const multiplier = unit === 'grams' ? Number(quantity) / 100 : Number(quantity);
    const preview = {
        calories: Math.round(food.calories * multiplier),
        protein: Math.round(food.protein * multiplier * 10) / 10,
        carbs: Math.round(food.carbs * multiplier * 10) / 10,
        fats: Math.round(food.fats * multiplier * 10) / 10,
    };

    const handlePresetPress = (value: number, index: number) => {
        setQuantity(value.toString());
        setUnit('grams');
        setActivePreset(index);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <View style={[styles.content, { backgroundColor: colors.background.card, borderColor: colors.border.primary, borderWidth: 1 }]}>
                    <View style={styles.indicator} />
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.foodName, { color: colors.text.primary }]}>{food.name}</Text>
                            <Text style={[styles.foodMeta, { color: colors.text.tertiary }]}>
                                {food.calories} kcal <Text style={{ fontSize: 10, opacity: 0.6 }}>/ 100g</Text>
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <View style={[styles.previewRow, { backgroundColor: colors.background.secondary }]}>
                            <View style={styles.previewItem}>
                                <Text style={[styles.previewValue, { color: colors.nutrition.calories }]}>{preview.calories}</Text>
                                <Text style={[styles.previewLabel, { color: colors.text.tertiary }]}>KCAL</Text>
                            </View>
                            <View style={styles.previewDivider} />
                            <View style={styles.previewItem}>
                                <Text style={[styles.previewValue, { color: colors.nutrition.protein }]}>{preview.protein}g</Text>
                                <Text style={[styles.previewLabel, { color: colors.text.tertiary }]}>PRO</Text>
                            </View>
                            <View style={styles.previewDivider} />
                            <View style={styles.previewItem}>
                                <Text style={[styles.previewValue, { color: colors.nutrition.carbs }]}>{preview.carbs}g</Text>
                                <Text style={[styles.previewLabel, { color: colors.text.tertiary }]}>CARB</Text>
                            </View>
                            <View style={styles.previewDivider} />
                            <View style={styles.previewItem}>
                                <Text style={[styles.previewValue, { color: colors.nutrition.fats }]}>{preview.fats}g</Text>
                                <Text style={[styles.previewLabel, { color: colors.text.tertiary }]}>FAT</Text>
                            </View>
                        </View>

                        <View style={styles.unitToggleRow}>
                            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>QUANTITY</Text>
                            <View style={[styles.toggleContainer, { backgroundColor: colors.background.secondary }]}>
                                <TouchableOpacity 
                                    onPress={() => { setUnit('grams'); setActivePreset(null); }}
                                    style={[styles.toggleBtn, unit === 'grams' && { backgroundColor: colors.background.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
                                >
                                    <Text style={[styles.toggleBtnText, { color: unit === 'grams' ? colors.accent.primary : colors.text.tertiary, fontWeight: unit === 'grams' ? 'bold' : 'normal' }]}>GRAMS</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => { setUnit('servings'); setActivePreset(null); }}
                                    style={[styles.toggleBtn, unit === 'servings' && { backgroundColor: colors.background.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
                                >
                                    <Text style={[styles.toggleBtnText, { color: unit === 'servings' ? colors.accent.primary : colors.text.tertiary, fontWeight: unit === 'servings' ? 'bold' : 'normal' }]}>NOS</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: colors.background.secondary, borderColor: colors.border.secondary }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text.primary }]}
                                value={quantity}
                                onChangeText={(t) => { setQuantity(t); setActivePreset(null); }}
                                keyboardType="numeric"
                                selectTextOnFocus
                            />
                            <Text style={[styles.inputUnit, { color: colors.text.tertiary }]}>{unit === 'grams' ? 'g' : 'Nos'}</Text>
                        </View>

                        {presets.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll} contentContainerStyle={styles.presetContent}>
                                {presets.map((p, idx) => (
                                    <TouchableOpacity 
                                        key={idx}
                                        onPress={() => handlePresetPress(p.value, idx)}
                                        style={[
                                            styles.presetBtn, 
                                            { backgroundColor: colors.background.secondary, borderColor: colors.border.secondary },
                                            activePreset === idx && { borderColor: colors.accent.primary, backgroundColor: colors.accent.primary + '10' }
                                        ]}
                                    >
                                        <Text style={[styles.presetText, { color: colors.text.primary }, activePreset === idx && { color: colors.accent.primary, fontWeight: 'bold' }]}>{p.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.mealHeaderRow}>
                            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>MEAL TYPE</Text>
                            <View style={[styles.autoBadge, { backgroundColor: colors.accent.primary + '15' }]}>
                                <Ionicons name="sparkles" size={10} color={colors.accent.primary} />
                                <Text style={[styles.autoText, { color: colors.accent.primary }]}>AUTO</Text>
                            </View>
                        </View>
                        <View style={styles.mealGrid}>
                            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                                <TouchableOpacity 
                                    key={type}
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMealType(type as any); }}
                                    style={[
                                        styles.mealBtn, 
                                        { backgroundColor: colors.background.secondary, borderColor: colors.border.secondary },
                                        mealType === type && { borderColor: colors.accent.primary, backgroundColor: colors.accent.primary + '08' }
                                    ]}
                                >
                                    <Text style={[
                                        styles.mealBtnText, 
                                        { color: colors.text.tertiary },
                                        mealType === type && { color: colors.accent.primary, fontWeight: 'bold' }
                                    ]}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.addBtn, { backgroundColor: colors.accent.primary }]}
                            onPress={() => onAdd(Number(quantity), unit, mealType)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.addBtnText, { color: colors.text.inverse }]}>Log to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.text.inverse} />
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: 40,
        maxHeight: '85%',
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    indicator: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
    },
    foodName: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    foodMeta: {
        fontSize: 13,
        marginTop: 4,
        fontWeight: '500',
    },
    closeBtn: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        paddingHorizontal: 24,
    },
    previewRow: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        alignItems: 'center',
    },
    previewItem: {
        flex: 1,
        alignItems: 'center',
    },
    previewValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    previewLabel: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    previewDivider: {
        width: 1,
        height: '40%',
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    unitToggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: 10,
        padding: 2,
    },
    toggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    toggleBtnText: {
        fontSize: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 20,
        height: 60,
        marginBottom: 16,
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
    presetScroll: {
        marginBottom: 24,
    },
    presetContent: {
        gap: 8,
        paddingRight: 24,
    },
    presetBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    presetText: {
        fontSize: 13,
    },
    mealHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    autoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    autoText: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    mealGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    mealBtn: {
        flex: 1,
        minWidth: '45%',
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1.5,
    },
    mealBtnText: {
        fontSize: 13,
    },
    addBtn: {
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 32,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addBtnText: {
        fontSize: 17,
        fontWeight: 'bold',
    }
});
