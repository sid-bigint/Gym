import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Modal,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format, addDays, isSameDay } from 'date-fns';

import { useNutritionStore, NutritionLog, MealSession } from '../../src/store/useNutritionStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useTheme } from '../../src/store/useTheme';
import { useScreenPadding } from '../../src/store/useScreenPadding';
import { MealSessionCard } from '../../src/components/nutrition/MealSessionCard';
import { UndoToast } from '../../src/components/nutrition/UndoToast';
import { useUndoDelete } from '../../src/hooks/useUndoDelete';
import { ContextualTipBanner } from '../../src/components/ContextualTipBanner';

const AnimatedView = Animated.createAnimatedComponent(View);

type ListItem =
    | { type: 'session'; session: MealSession }
    | { type: 'ungrouped'; logs: NutritionLog[] }
    | { type: 'ungrouped_item'; log: NutritionLog };

export default function NutritionScreen() {
    const {
        logs, totals, mealSessions, ungroupedLogs,
        loadLogs, deleteLog, updateLog, addLog,
        deleteMealSession, renameMealSession,
        selectedDate, setDate, getRecentLogs,
    } = useNutritionStore();
    const { user, loadUser } = useUserStore();
    const { colors } = useTheme();
    const { contentTop } = useScreenPadding();

    const [editingLog, setEditingLog] = useState<NutritionLog | null>(null);
    const [showUndo, setShowUndo] = useState(false);
    const [repeatFlash, setRepeatFlash] = useState<string | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [recentHistory, setRecentHistory] = useState<any[]>([]);
    const [isFabExpanded, setIsFabExpanded] = useState(false);
    const fabAnim = useRef(new Animated.Value(0)).current;
    const { lastDeletedItem, storeDeletedItem, clearLastDeleted } = useUndoDelete<NutritionLog>();

    const [celebration, setCelebration] = useState<string | null>(null);
    const celebrationAnim = useRef(new Animated.Value(0)).current;
    const celebratedGoalsRef = useRef<Set<string>>(new Set());

    const calAnim = useRef(new Animated.Value(0)).current;
    const protAnim = useRef(new Animated.Value(0)).current;
    const carbAnim = useRef(new Animated.Value(0)).current;
    const fatAnim = useRef(new Animated.Value(0)).current;

    const [editForm, setEditForm] = useState({
        foodName: '', calories: '', protein: '', carbs: '', fats: '',
        mealType: 'snack' as NutritionLog['mealType'],
    });

    useEffect(() => {
        if (!user) loadUser();
    }, []);

    useFocusEffect(useCallback(() => {
        loadLogs();
    }, [selectedDate]));

    useEffect(() => {
        const getVal = (curr: number, target: number) => target > 0 ? Math.min(curr / target, 1) : 0;
        Animated.parallel([
            Animated.spring(calAnim,  { toValue: getVal(totals.calories, user?.calorieGoal || 2000), tension: 20, friction: 8, useNativeDriver: false }),
            Animated.spring(protAnim, { toValue: getVal(totals.protein,  user?.targetProtein  || 150),  tension: 20, friction: 8, useNativeDriver: false }),
            Animated.spring(carbAnim, { toValue: getVal(totals.carbs,    user?.targetCarbs    || 200),  tension: 20, friction: 8, useNativeDriver: false }),
            Animated.spring(fatAnim,  { toValue: getVal(totals.fats,     user?.targetFats     || 70),   tension: 20, friction: 8, useNativeDriver: false }),
        ]).start();
    }, [totals, user]);

    useEffect(() => {
        if (!user || totals.calories === 0) return;
        const goals = [
            { key: 'calories', current: totals.calories, target: user.calorieGoal || 2000, label: 'Calorie Goal' },
            { key: 'protein',  current: totals.protein,  target: user.targetProtein  || 150,  label: 'Protein Goal' },
        ];
        for (const g of goals) {
            if (g.current >= g.target && !celebratedGoalsRef.current.has(g.key)) {
                celebratedGoalsRef.current.add(g.key);
                setCelebration(`🎉 ${g.label} reached!`);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Animated.sequence([
                    Animated.spring(celebrationAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
                    Animated.delay(2500),
                    Animated.timing(celebrationAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start(() => setCelebration(null));
                break;
            }
        }
    }, [totals]);

    const handleEdit = (log: NutritionLog) => {
        setEditingLog(log);
        setEditForm({
            foodName: log.foodName,
            calories: log.calories.toString(),
            protein:  log.protein.toString(),
            carbs:    log.carbs.toString(),
            fats:     log.fats.toString(),
            mealType: log.mealType,
        });
    };

    const handleSaveEdit = async () => {
        if (!editingLog) return;
        try {
            await updateLog({
                ...editingLog,
                foodName: editForm.foodName,
                calories: Number(editForm.calories),
                protein:  Number(editForm.protein),
                carbs:    Number(editForm.carbs),
                fats:     Number(editForm.fats),
                mealType: editForm.mealType,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEditingLog(null);
        } catch (error) {
            console.error("Failed to update log", error);
        }
    };

    const handleDeleteLog = async (log: NutritionLog) => {
        storeDeletedItem(log);
        await deleteLog(log.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowUndo(true);
    };

    const handleUndo = async () => {
        if (lastDeletedItem) {
            await addLog({
                foodName: lastDeletedItem.foodName,
                calories: lastDeletedItem.calories,
                protein:  lastDeletedItem.protein,
                carbs:    lastDeletedItem.carbs,
                fats:     lastDeletedItem.fats,
                mealType: lastDeletedItem.mealType,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowUndo(false);
            clearLastDeleted();
        }
    };

    const handleExport = async () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const sessionSummary = mealSessions
            .map(s => `🍽 ${s.name} (${s.totals.calories} kcal)\n` + s.logs.map(l => `  · ${l.foodName} — ${l.calories} kcal`).join('\n'))
            .join('\n\n');
        const summary = `📅 ${dateStr} Summary\n🔥 ${totals.calories} / ${user?.calorieGoal || 2000} kcal\n🥩 P: ${totals.protein}g | 🍚 C: ${totals.carbs}g | 🧈 F: ${totals.fats}g\n\n${sessionSummary}`;
        try {
            await Share.share({ message: summary });
        } catch (e) {
            console.error("Export failed", e);
        }
    };

    const openQuickAdd = async () => {
        const history = await getRecentLogs(10);
        setRecentHistory(history);
        setShowQuickAdd(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleQuickLog = async (item: any) => {
        await addLog({
            foodName: item.foodName,
            calories: item.calories,
            protein:  item.protein,
            carbs:    item.carbs,
            fats:     item.fats,
            mealType: item.mealType,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRepeatFlash(item.foodName);
        setShowQuickAdd(false);
        toggleFab();
        setTimeout(() => setRepeatFlash(null), 1500);
    };

    const toggleFab = () => {
        const toValue = isFabExpanded ? 0 : 1;
        Animated.spring(fabAnim, { toValue, useNativeDriver: true, friction: 5, tension: 40 }).start();
        setIsFabExpanded(!isFabExpanded);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const renderProgressBar = (label: string, current: number, target: number, anim: Animated.Value, color: string) => (
        <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.text.primary }]}>{label}</Text>
                <Text style={[styles.progressValue, { color: colors.text.tertiary }]}>
                    {current} / {target} {label === 'Calories' ? 'kcal' : 'g'}
                </Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.background.secondary }]}>
                <AnimatedView style={[styles.fill, {
                    width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: color,
                }]} />
            </View>
        </View>
    );

    // Build the flat list data: sessions first, then ungrouped individual items
    const listData: ListItem[] = [
        ...mealSessions.map(s => ({ type: 'session' as const, session: s })),
        ...ungroupedLogs.map(l => ({ type: 'ungrouped_item' as const, log: l })),
    ];

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === 'session') {
            return (
                <MealSessionCard
                    session={item.session}
                    onDeleteSession={(id) => deleteMealSession(id)}
                    onRenameSession={(id, name) => renameMealSession(id, name)}
                    onDeleteLog={handleDeleteLog}
                    onAddMore={(sessionId, mealType) =>
                        router.push(`/nutrition/add?sessionId=${sessionId}&mealType=${mealType}` as any)
                    }
                    onEditLog={handleEdit}
                />
            );
        }
        if (item.type === 'ungrouped_item') {
            const log = item.log;
            return (
                <TouchableOpacity
                    style={[styles.logItem, { backgroundColor: colors.background.card }]}
                    onPress={() => handleEdit(log)}
                    onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleDeleteLog(log);
                    }}
                >
                    <View style={styles.logLeft}>
                        <Text style={[styles.logName, { color: colors.text.primary }]}>{log.foodName}</Text>
                        <Text style={[styles.logMacros, { color: colors.text.tertiary }]}>
                            P: {log.protein}g · C: {log.carbs}g · F: {log.fats}g
                        </Text>
                    </View>
                    <View style={styles.logRight}>
                        <Text style={[styles.logCal, { color: colors.nutrition.calories }]}>{log.calories}</Text>
                        <Text style={[styles.logCalUnit, { color: colors.text.tertiary }]}>kcal</Text>
                    </View>
                </TouchableOpacity>
            );
        }
        return null;
    };

    const hasAnyFood = logs.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: contentTop }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.text.primary }]}>Nutrition</Text>
                    <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>Track your macros & fuel</Text>
                </View>
                <TouchableOpacity onPress={handleExport} style={[styles.shareBtn, { backgroundColor: colors.background.elevated }]}>
                    <Ionicons name="share-outline" size={22} color={colors.accent.primary} />
                </TouchableOpacity>
            </View>

            {hasAnyFood && (
                <ContextualTipBanner
                    tipKey="nutrition_meal_sessions"
                    message="Long-press any meal card to rename or save it as a template"
                    icon="restaurant-outline"
                    accentColor="#10B981"
                />
            )}

            <FlatList
                data={listData}
                keyExtractor={(item, idx) =>
                    item.type === 'session'
                        ? `session-${item.session.id}`
                        : `ungrouped-${item.log.id}`
                }
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={5}
                removeClippedSubviews={true}
                ListHeaderComponent={
                    <>
                        {/* Macro Dashboard */}
                        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                            {renderProgressBar('Calories', totals.calories, user?.calorieGoal || 2000, calAnim, colors.nutrition.calories)}
                            <View style={styles.macroRow}>
                                <View style={{ flex: 1 }}>
                                    {renderProgressBar('Protein', totals.protein, user?.targetProtein || 150, protAnim, colors.nutrition.protein)}
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={{ flex: 1 }}>
                                    {renderProgressBar('Carbs', totals.carbs, user?.targetCarbs || 200, carbAnim, colors.nutrition.carbs)}
                                </View>
                            </View>
                            {renderProgressBar('Fats', totals.fats, user?.targetFats || 70, fatAnim, colors.nutrition.fats)}
                        </View>

                        {/* Date Navigator */}
                        <View style={[styles.dateNav, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDate(addDays(selectedDate, -1)); }}>
                                <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                            <View style={styles.dateInfo}>
                                <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
                                <Text style={[styles.dateText, { color: colors.text.primary }]}>
                                    {isSameDay(selectedDate, new Date())
                                        ? "Today"
                                        : isSameDay(selectedDate, addDays(new Date(), -1))
                                            ? "Yesterday"
                                            : format(selectedDate, 'MMM do, yyyy')}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDate(addDays(selectedDate, 1)); }}>
                                <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {repeatFlash && (
                            <View style={[styles.flashBanner, { backgroundColor: colors.accent.primary + '20' }]}>
                                <Ionicons name="checkmark-circle" size={16} color={colors.accent.primary} />
                                <Text style={[styles.flashText, { color: colors.accent.primary }]}>
                                    {repeatFlash} added again!
                                </Text>
                            </View>
                        )}

                        {/* Section label */}
                        {hasAnyFood && (
                            <View style={styles.sectionRow}>
                                <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
                                    {mealSessions.length > 0
                                        ? `${mealSessions.length} meal${mealSessions.length > 1 ? 's' : ''} · ${logs.length} item${logs.length > 1 ? 's' : ''}`
                                        : `${logs.length} item${logs.length > 1 ? 's' : ''} logged`}
                                </Text>
                            </View>
                        )}

                        {/* Ungrouped section header */}
                        {ungroupedLogs.length > 0 && mealSessions.length > 0 && (
                            <Text style={[styles.ungroupedLabel, { color: colors.text.disabled }]}>
                                Individual items
                            </Text>
                        )}
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="restaurant-outline" size={48} color={colors.text.disabled} />
                        <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>No food logged</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.text.disabled }]}>
                            Tap the + button below to log your first meal
                        </Text>
                    </View>
                }
                ListFooterComponent={<View style={{ height: 120 }} />}
            />

            {/* FAB */}
            <View style={styles.fabContainer}>
                <AnimatedView style={[styles.subFabContainer, {
                    opacity: fabAnim,
                    transform: [{ translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }]}>
                    <Text style={[styles.fabLabel, { color: colors.text.primary }]}>Search & New</Text>
                    <TouchableOpacity
                        style={[styles.miniFab, { backgroundColor: colors.background.elevated, borderColor: colors.border.primary }]}
                        onPress={() => { toggleFab(); router.push('/nutrition/add'); }}
                    >
                        <Ionicons name="search" size={22} color={colors.accent.primary} />
                    </TouchableOpacity>
                </AnimatedView>

                <AnimatedView style={[styles.subFabContainer, {
                    opacity: fabAnim,
                    transform: [{ translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                }]}>
                    <Text style={[styles.fabLabel, { color: colors.text.primary }]}>Quick Add</Text>
                    <TouchableOpacity
                        style={[styles.miniFab, { backgroundColor: colors.background.elevated, borderColor: colors.border.primary }]}
                        onPress={() => { toggleFab(); openQuickAdd(); }}
                    >
                        <Ionicons name="time-outline" size={24} color={colors.accent.primary} />
                    </TouchableOpacity>
                </AnimatedView>

                <TouchableOpacity
                    style={[styles.mainFab, { backgroundColor: colors.accent.primary }]}
                    onPress={toggleFab}
                    activeOpacity={0.9}
                >
                    <AnimatedView style={{ transform: [{ rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                        <Ionicons name="add" size={32} color={colors.text.inverse} />
                    </AnimatedView>
                </TouchableOpacity>
            </View>

            <UndoToast
                visible={showUndo}
                message="Item deleted"
                onUndo={handleUndo}
                onDismiss={() => setShowUndo(false)}
            />

            {celebration && (
                <Animated.View style={[
                    styles.celebrationToast,
                    {
                        backgroundColor: colors.accent.primary,
                        opacity: celebrationAnim,
                        transform: [{ translateY: celebrationAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                    },
                ]}>
                    <Text style={styles.celebrationText}>{celebration}</Text>
                </Animated.View>
            )}

            {/* Quick Add Modal */}
            <Modal visible={showQuickAdd} animationType="slide" transparent onRequestClose={() => setShowQuickAdd(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background.primary, height: '60%' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border.secondary }]}>
                            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Quick Add</Text>
                            <TouchableOpacity onPress={() => setShowQuickAdd(false)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={recentHistory}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={{ padding: 20 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.quickItem, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                                    onPress={() => handleQuickLog(item)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.quickName, { color: colors.text.primary }]}>{item.foodName}</Text>
                                        <Text style={[styles.quickMacros, { color: colors.text.tertiary }]}>{item.calories} kcal · P:{item.protein}g</Text>
                                    </View>
                                    <Ionicons name="add-circle" size={24} color={colors.accent.primary} />
                                </TouchableOpacity>
                            )}
                            ListHeaderComponent={
                                <TouchableOpacity
                                    style={[styles.searchNewBtn, { backgroundColor: colors.accent.primary + '15' }]}
                                    onPress={() => { setShowQuickAdd(false); router.push('/nutrition/add'); }}
                                >
                                    <Ionicons name="search" size={20} color={colors.accent.primary} />
                                    <Text style={[styles.searchNewText, { color: colors.accent.primary }]}>Search or Add New Food</Text>
                                </TouchableOpacity>
                            }
                            ListFooterComponent={<View style={{ height: 40 }} />}
                            ListEmptyComponent={
                                <Text style={{ textAlign: 'center', color: colors.text.disabled, marginTop: 40 }}>
                                    No recent items found
                                </Text>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Edit Log Modal */}
            <Modal visible={!!editingLog} animationType="slide" transparent onRequestClose={() => setEditingLog(null)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border.secondary }]}>
                            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Edit Item</Text>
                            <TouchableOpacity onPress={() => setEditingLog(null)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Food Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background.elevated, color: colors.text.primary, borderColor: colors.border.primary }]}
                                value={editForm.foodName}
                                onChangeText={(t) => setEditForm(prev => ({ ...prev, foodName: t }))}
                            />
                            <View style={styles.row}>
                                <View style={styles.col}>
                                    <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Calories</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background.elevated, color: colors.text.primary, borderColor: colors.border.primary }]}
                                        value={editForm.calories}
                                        keyboardType="numeric"
                                        onChangeText={(t) => setEditForm(prev => ({ ...prev, calories: t }))}
                                    />
                                </View>
                                <View style={styles.col}>
                                    <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Protein (g)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background.elevated, color: colors.text.primary, borderColor: colors.border.primary }]}
                                        value={editForm.protein}
                                        keyboardType="numeric"
                                        onChangeText={(t) => setEditForm(prev => ({ ...prev, protein: t }))}
                                    />
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.col}>
                                    <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Carbs (g)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background.elevated, color: colors.text.primary, borderColor: colors.border.primary }]}
                                        value={editForm.carbs}
                                        keyboardType="numeric"
                                        onChangeText={(t) => setEditForm(prev => ({ ...prev, carbs: t }))}
                                    />
                                </View>
                                <View style={styles.col}>
                                    <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Fats (g)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background.elevated, color: colors.text.primary, borderColor: colors.border.primary }]}
                                        value={editForm.fats}
                                        keyboardType="numeric"
                                        onChangeText={(t) => setEditForm(prev => ({ ...prev, fats: t }))}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent.primary }]} onPress={handleSaveEdit}>
                                <Text style={[styles.saveBtnText, { color: colors.text.inverse }]}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8, marginTop: 8 },
    title: { fontSize: 32, fontWeight: 'bold' },
    subtitle: { fontSize: 14, fontWeight: '500', marginTop: 2 },
    shareBtn: { padding: 10, borderRadius: 12 },
    listContent: { paddingHorizontal: 20 },
    card: { padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1 },
    macroRow: { flexDirection: 'row', marginVertical: 12 },
    progressContainer: { width: '100%' },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontWeight: '700', fontSize: 13 },
    progressValue: { fontSize: 12 },
    track: { height: 8, borderRadius: 4, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4 },
    dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 16, borderWidth: 1 },
    dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateText: { fontSize: 15, fontWeight: '600' },
    sectionRow: { marginBottom: 10 },
    sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    ungroupedLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
    flashBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginBottom: 12 },
    flashText: { fontSize: 14, fontWeight: '600' },
    logItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 10 },
    logLeft: { flex: 1, marginRight: 16 },
    logName: { fontSize: 16, fontWeight: '600' },
    logMacros: { fontSize: 12, marginTop: 4 },
    logRight: { alignItems: 'flex-end', marginRight: 8 },
    logCal: { fontSize: 20, fontWeight: 'bold' },
    logCalUnit: { fontSize: 11 },
    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600' },
    emptySubtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
    fabContainer: { position: 'absolute', bottom: 32, right: 20, alignItems: 'flex-end', gap: 12 },
    subFabContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    fabLabel: { fontSize: 14, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    mainFab: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    miniFab: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    celebrationToast: { position: 'absolute', top: 100, alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    celebrationText: { color: 'white', fontSize: 16, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalBody: { padding: 20 },
    inputLabel: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
    input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, marginBottom: 14, fontSize: 16 },
    row: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },
    saveBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    saveBtnText: { fontSize: 16, fontWeight: 'bold' },
    quickItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
    quickName: { fontSize: 15, fontWeight: '600' },
    quickMacros: { fontSize: 12, marginTop: 2 },
    searchNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 12, marginBottom: 20 },
    searchNewText: { fontSize: 15, fontWeight: 'bold' },
});
