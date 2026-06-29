import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../store/useTheme';
import * as Haptics from 'expo-haptics';

interface FloatingReviewCardProps {
    items: any[];
    defaultSessionName?: string;
    onFinish: (sessionName: string) => void;
    onSaveTemplate: () => void;
    onRemoveItem: (index: number) => void;
}

export const FloatingReviewCard: React.FC<FloatingReviewCardProps> = ({
    items,
    defaultSessionName = '',
    onFinish,
    onSaveTemplate,
    onRemoveItem,
}) => {
    const { colors } = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [mealName, setMealName] = useState(defaultSessionName);
    const bottomAnim = useRef(new Animated.Value(32)).current;

    // Animate the compact card above the keyboard when it appears
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onShow = (e: any) => {
            if (expanded) return;
            Animated.spring(bottomAnim, {
                toValue: e.endCoordinates.height + 12,
                useNativeDriver: false,
                friction: 9,
                tension: 60,
            }).start();
        };
        const onHide = () => {
            Animated.spring(bottomAnim, {
                toValue: 32,
                useNativeDriver: false,
                friction: 9,
                tension: 60,
            }).start();
        };

        const showSub = Keyboard.addListener(showEvent, onShow);
        const hideSub = Keyboard.addListener(hideEvent, onHide);
        return () => { showSub.remove(); hideSub.remove(); };
    }, [expanded]);

    const totals = items.reduce(
        (acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fats: acc.fats + item.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const toggleExpanded = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(v => !v);
    };

    const handleFinish = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onFinish(mealName.trim());
    };

    if (items.length === 0) return null;

    // ── Expanded sheet ──────────────────────────────────────────────
    if (expanded) {
        return (
            <View style={styles.expandedWrapper}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={toggleExpanded} />
                <View style={[styles.container, styles.expandedContainer, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                    <View style={styles.expandedHeader}>
                        <Text style={[styles.expandedTitle, { color: colors.text.primary }]}>Review Meal</Text>
                        <TouchableOpacity onPress={toggleExpanded}>
                            <Ionicons name="chevron-down" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.nameField, { backgroundColor: colors.background.elevated, borderColor: colors.border.primary }]}>
                        <Ionicons name="restaurant-outline" size={16} color={colors.accent.primary} />
                        <TextInput
                            value={mealName}
                            onChangeText={setMealName}
                            placeholder="Meal name (e.g. Lunch)"
                            placeholderTextColor={colors.text.disabled}
                            style={[styles.nameInput, { color: colors.text.primary }]}
                            returnKeyType="done"
                        />
                    </View>

                    <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
                        {items.map((item, idx) => (
                            <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.border.secondary }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemName, { color: colors.text.primary }]}>{item.foodName}</Text>
                                    <Text style={[styles.itemSub, { color: colors.text.tertiary }]}>
                                        {item.quantity}{item.unit} · {item.calories} kcal
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => onRemoveItem(idx)}>
                                    <Ionicons name="trash-outline" size={20} color={colors.status?.error ?? '#EF4444'} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <View style={styles.summaryBox}>
                            <View style={styles.summaryMain}>
                                <Text style={[styles.totalLabel, { color: colors.text.secondary }]}>TOTAL ENERGY</Text>
                                <Text style={[styles.totalVal, { color: colors.nutrition?.calories ?? '#F59E0B' }]}>
                                    {totals.calories} kcal
                                </Text>
                            </View>
                            <Text style={[styles.macroText, { color: colors.text.tertiary }]}>
                                P: {totals.protein}g · C: {totals.carbs}g · F: {totals.fats}g
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.templateBtn, { borderColor: colors.accent.primary }]}
                            onPress={onSaveTemplate}
                        >
                            <Ionicons name="star-outline" size={18} color={colors.accent.primary} />
                            <Text style={[styles.templateText, { color: colors.accent.primary }]}>Save as Template</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.accent.primary }]} onPress={handleFinish}>
                        <Text style={[styles.doneBtnText, { color: colors.text.inverse }]}>
                            {mealName.trim() ? `Log "${mealName.trim()}"` : 'Log Items'}
                        </Text>
                        <Ionicons name="checkmark" size={20} color={colors.text.inverse} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Compact card (floats above keyboard) ────────────────────────
    return (
        <Animated.View style={[styles.wrapper, { bottom: bottomAnim }]}>
            <View style={[styles.container, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                {/* Inline meal name input */}
                <View style={[styles.compactNameRow, { borderBottomColor: colors.border.secondary }]}>
                    <Ionicons name="restaurant-outline" size={14} color={colors.accent.primary} />
                    <TextInput
                        value={mealName}
                        onChangeText={setMealName}
                        placeholder="Name this meal…"
                        placeholderTextColor={colors.text.disabled}
                        style={[styles.compactNameInput, { color: colors.text.primary }]}
                        returnKeyType="done"
                    />
                </View>

                <View style={styles.compactRow}>
                    <View style={styles.compactInfo}>
                        <View style={[styles.badge, { backgroundColor: colors.accent.primary }]}>
                            <Text style={styles.badgeText}>{items.length}</Text>
                        </View>
                        <Text style={[styles.compactText, { color: colors.text.primary }]}>
                            {totals.calories} kcal
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.viewBtn} onPress={toggleExpanded}>
                        <Text style={[styles.viewBtnText, { color: colors.accent.primary }]}>Review</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.accent.primary }]} onPress={handleFinish}>
                    <Text style={[styles.doneBtnText, { color: colors.text.inverse }]}>
                        {mealName.trim() ? `Log "${mealName.trim()}"` : 'Log Items'}
                    </Text>
                    <Ionicons name="checkmark" size={20} color={colors.text.inverse} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 100,
    },
    expandedWrapper: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0, top: 0,
        justifyContent: 'flex-end',
        zIndex: 100,
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
        padding: 20,
        maxHeight: '85%',
    },
    expandedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    expandedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    nameField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
    },
    nameInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    compactNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        marginBottom: 4,
    },
    compactNameInput: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 10,
    },
    compactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    badge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    compactText: { fontSize: 15, fontWeight: 'bold' },
    viewBtn: { paddingVertical: 4, paddingHorizontal: 10 },
    viewBtnText: { fontSize: 13, fontWeight: 'bold' },
    itemList: { maxHeight: 280 },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 10,
    },
    itemName: { fontSize: 14, fontWeight: '600' },
    itemSub: { fontSize: 12, marginTop: 2 },
    summaryBox: { marginTop: 18, marginBottom: 18, alignItems: 'center', gap: 4 },
    summaryMain: { alignItems: 'center' },
    totalLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    totalVal: { fontSize: 24, fontWeight: 'bold' },
    macroText: { fontSize: 13 },
    templateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 20,
    },
    templateText: { fontSize: 14, fontWeight: 'bold' },
    doneBtn: {
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    doneBtnText: { fontSize: 16, fontWeight: 'bold' },
});
