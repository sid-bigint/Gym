import React, { useState, useEffect, useMemo } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';
import { SavedMeal, SavedMealItem } from '../../services/savedMealsService';

interface EditSavedMealModalProps {
    visible: boolean;
    meal: SavedMeal | null;
    onClose: () => void;
    onSave: (id: number, name: string, items: SavedMealItem[]) => void;
}

export const EditSavedMealModal: React.FC<EditSavedMealModalProps> = ({ visible, meal, onClose, onSave }) => {
    const { colors } = useTheme();
    const [name, setName] = useState('');
    const [items, setItems] = useState<SavedMealItem[]>([]);

    useEffect(() => {
        if (meal) {
            setName(meal.name);
            setItems(meal.items);
        }
    }, [meal, visible]);

    const totals = useMemo(() => {
        return items.reduce((acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fats: acc.fats + item.fats,
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }, [items]);

    const handleUpdateItem = (index: number, grams: number) => {
        const newItems = [...items];
        const item = newItems[index];
        const ratio = grams / item.grams;
        
        newItems[index] = {
            ...item,
            grams,
            calories: Math.round(item.calories * ratio),
            protein: Math.round(item.protein * ratio * 10) / 10,
            carbs: Math.round(item.carbs * ratio * 10) / 10,
            fats: Math.round(item.fats * ratio * 10) / 10,
        };
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    if (!meal) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: colors.background.primary }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text.primary }]}>Edit Template</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Template Name</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text.primary, backgroundColor: colors.background.elevated, borderColor: colors.border.primary }]}
                            value={name}
                            onChangeText={setName}
                        />

                        <View style={[styles.summaryCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                            <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>Total Macros</Text>
                            <View style={styles.summaryGrid}>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryVal, { color: colors.nutrition.calories }]}>{Math.round(totals.calories)}</Text>
                                    <Text style={[styles.summaryLab, { color: colors.text.tertiary }]}>kcal</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryVal, { color: colors.nutrition.protein }]}>{totals.protein.toFixed(1)}g</Text>
                                    <Text style={[styles.summaryLab, { color: colors.text.tertiary }]}>Prot</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryVal, { color: colors.nutrition.carbs }]}>{totals.carbs.toFixed(1)}g</Text>
                                    <Text style={[styles.summaryLab, { color: colors.text.tertiary }]}>Carb</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryVal, { color: colors.nutrition.fats }]}>{totals.fats.toFixed(1)}g</Text>
                                    <Text style={[styles.summaryLab, { color: colors.text.tertiary }]}>Fat</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.label, { color: colors.text.secondary, marginTop: 24 }]}>Ingredients</Text>
                        {items.map((item, idx) => (
                            <View key={idx} style={[styles.itemCard, { backgroundColor: colors.background.elevated, borderColor: colors.border.secondary }]}>
                                <View style={styles.itemHeader}>
                                    <Text style={[styles.itemName, { color: colors.text.primary }]} numberOfLines={1}>{item.name}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveItem(idx)}>
                                        <Ionicons name="trash-outline" size={18} color={colors.accent.warning} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.itemDetails}>
                                    <View style={styles.qtyBox}>
                                        <TextInput
                                            style={[styles.qtyInput, { color: colors.text.primary, borderBottomColor: colors.border.primary }]}
                                            value={String(item.grams)}
                                            keyboardType="numeric"
                                            onChangeText={(t) => handleUpdateItem(idx, Number(t) || 0)}
                                        />
                                        <Text style={[styles.qtyUnit, { color: colors.text.tertiary }]}>g</Text>
                                    </View>
                                    <Text style={[styles.itemMacros, { color: colors.text.tertiary }]}>
                                        {Math.round(item.calories)} kcal • P: {item.protein}g
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={[styles.saveBtn, { backgroundColor: colors.accent.primary }]}
                            onPress={() => onSave(meal.id, name, items)}
                        >
                            <Text style={[styles.saveBtnText, { color: colors.text.inverse }]}>Update Template</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    title: { fontSize: 20, fontWeight: 'bold' },
    body: { padding: 20 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
    input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
    summaryCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
    summaryTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
    summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryItem: { alignItems: 'center' },
    summaryVal: { fontSize: 18, fontWeight: 'bold' },
    summaryLab: { fontSize: 11, marginTop: 2 },
    itemCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    itemName: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 12 },
    itemDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    qtyInput: { fontSize: 16, fontWeight: 'bold', borderBottomWidth: 1, minWidth: 40, textAlign: 'center' },
    qtyUnit: { fontSize: 14 },
    itemMacros: { fontSize: 12 },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    saveBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: 'bold' }
});
