import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../store/useTheme';
import * as Haptics from 'expo-haptics';

interface FloatingReviewCardProps {
    items: any[];
    onFinish: () => void;
    onSaveTemplate: () => void;
    onRemoveItem: (index: number) => void;
}

export const FloatingReviewCard: React.FC<FloatingReviewCardProps> = ({ 
    items, 
    onFinish, 
    onSaveTemplate,
    onRemoveItem
}) => {
    const { colors } = useTheme();
    const [expanded, setExpanded] = useState(false);

    const totals = items.reduce((acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fats: acc.fats + item.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const toggleExpanded = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(!expanded);
    };

    if (items.length === 0) return null;

    return (
        <View style={[styles.wrapper, expanded && styles.expandedWrapper]}>
            {expanded && (
                <TouchableOpacity 
                    style={styles.backdrop} 
                    activeOpacity={1} 
                    onPress={toggleExpanded}
                />
            )}
            <View style={[
                styles.container, 
                { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                expanded && styles.expandedContainer
            ]}>
                {expanded && (
                    <View style={styles.expandedHeader}>
                        <Text style={[styles.expandedTitle, { color: colors.text.primary }]}>Review Meal</Text>
                        <TouchableOpacity onPress={toggleExpanded}>
                            <Ionicons name="chevron-down" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                )}

                {expanded ? (
                    <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
                        {items.map((item, idx) => (
                            <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.border.secondary }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemName, { color: colors.text.primary }]}>{item.foodName}</Text>
                                    <Text style={[styles.itemSub, { color: colors.text.tertiary }]}>{item.quantity}{item.unit} • {item.calories} kcal</Text>
                                </View>
                                <TouchableOpacity onPress={() => onRemoveItem(idx)}>
                                    <Ionicons name="trash-outline" size={20} color={colors.status.error} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <View style={styles.summaryBox}>
                            <View style={styles.summaryMain}>
                                <Text style={[styles.totalLabel, { color: colors.text.secondary }]}>TOTAL ENERGY</Text>
                                <Text style={[styles.totalVal, { color: colors.nutrition.calories }]}>{totals.calories} kcal</Text>
                            </View>
                            <View style={styles.summaryMacros}>
                                <Text style={[styles.macroText, { color: colors.text.tertiary }]}>
                                    P: {totals.protein}g  •  C: {totals.carbs}g  •  F: {totals.fats}g
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.templateBtn, { borderColor: colors.accent.primary }]}
                            onPress={onSaveTemplate}
                        >
                            <Ionicons name="star-outline" size={18} color={colors.accent.primary} />
                            <Text style={[styles.templateText, { color: colors.accent.primary }]}>Save as Template</Text>
                        </TouchableOpacity>
                    </ScrollView>
                ) : (
                    <View style={styles.compactRow}>
                        <View style={styles.compactInfo}>
                            <View style={[styles.badge, { backgroundColor: colors.accent.primary }]}>
                                <Text style={styles.badgeText}>{items.length}</Text>
                            </View>
                            <Text style={[styles.compactText, { color: colors.text.primary }]}>
                                {totals.calories} kcal added
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.viewBtn} onPress={toggleExpanded}>
                            <Text style={[styles.viewBtnText, { color: colors.accent.primary }]}>Review</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity 
                    style={[styles.doneBtn, { backgroundColor: colors.accent.primary }]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onFinish();
                    }}
                >
                    <Text style={[styles.doneBtnText, { color: colors.text.inverse }]}>Finish & Log</Text>
                    <Ionicons name="checkmark" size={20} color={colors.text.inverse} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 32,
        left: 20,
        right: 20,
        zIndex: 100,
    },
    expandedWrapper: {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 12,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    expandedContainer: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        padding: 24,
        maxHeight: '80%',
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 12,
    },
    compactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    badge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    compactText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    viewBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    viewBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    expandedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    expandedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    itemList: {
        maxHeight: 300,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
    },
    itemSub: {
        fontSize: 12,
        marginTop: 2,
    },
    summaryBox: {
        marginTop: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    summaryMain: {
        alignItems: 'center',
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    totalVal: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    summaryMacros: {
        marginTop: 4,
    },
    macroText: {
        fontSize: 13,
    },
    templateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 24,
    },
    templateText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    doneBtn: {
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    doneBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
