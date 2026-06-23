import React, { useRef, useState } from 'react';
import {
    Alert,
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/useTheme';
import type { MealSession, NutritionLog } from '../../store/useNutritionStore';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const MEAL_META: Record<string, { icon: string; color: string; label: string }> = {
    breakfast: { icon: 'sunny-outline',     color: '#F59E0B', label: 'Breakfast' },
    lunch:     { icon: 'restaurant-outline', color: '#10B981', label: 'Lunch' },
    dinner:    { icon: 'moon-outline',       color: '#8B5CF6', label: 'Dinner' },
    snack:     { icon: 'cafe-outline',       color: '#EF4444', label: 'Snack' },
};

interface Props {
    session: MealSession;
    onDeleteSession: (id: number) => void;
    onRenameSession: (id: number, name: string) => void;
    onDeleteLog: (logId: number) => void;
    onAddMore: (sessionId: number, mealType: string) => void;
    onEditLog?: (log: NutritionLog) => void;
}

export function MealSessionCard({
    session,
    onDeleteSession,
    onRenameSession,
    onDeleteLog,
    onAddMore,
    onEditLog,
}: Props) {
    const { colors } = useTheme();
    const [expanded, setExpanded] = useState(true);
    const [isRenaming, setIsRenaming] = useState(false);
    const [draftName, setDraftName] = useState(session.name);
    const renameInputRef = useRef<TextInput>(null);

    const meta = MEAL_META[session.mealType] ?? MEAL_META.snack;

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(v => !v);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const openMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(session.name, undefined, [
            {
                text: 'Rename',
                onPress: () => {
                    setDraftName(session.name);
                    setIsRenaming(true);
                    setTimeout(() => renameInputRef.current?.focus(), 100);
                },
            },
            {
                text: 'Save as Template',
                onPress: () => {
                    if (Platform.OS === 'ios') {
                        Alert.prompt('Save Template', 'Enter a name for this template', (name) => {
                            if (name?.trim()) {
                                const { saveMealFromLogs } = require('../../store/useNutritionStore').useNutritionStore.getState();
                                saveMealFromLogs(name.trim(), session.logs);
                            }
                        });
                    } else {
                        // Android: save with the session name directly
                        const { saveMealFromLogs } = require('../../store/useNutritionStore').useNutritionStore.getState();
                        saveMealFromLogs(session.name, session.logs);
                    }
                },
            },
            {
                text: 'Delete Meal',
                style: 'destructive',
                onPress: () =>
                    Alert.alert(
                        'Delete Meal',
                        `Remove "${session.name}" and all ${session.logs.length} item${session.logs.length !== 1 ? 's' : ''} inside it?`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => onDeleteSession(session.id) },
                        ]
                    ),
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const commitRename = () => {
        setIsRenaming(false);
        const trimmed = draftName.trim();
        if (trimmed && trimmed !== session.name) {
            onRenameSession(session.id, trimmed);
        } else {
            setDraftName(session.name);
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            {/* ── Header ── */}
            <TouchableOpacity
                style={styles.header}
                onPress={toggle}
                onLongPress={openMenu}
                activeOpacity={0.75}
            >
                {/* Type icon */}
                <View style={[styles.typeIcon, { backgroundColor: meta.color + '22' }]}>
                    <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                </View>

                {/* Name + subtitle */}
                <View style={styles.headerCenter}>
                    {isRenaming ? (
                        <TextInput
                            ref={renameInputRef}
                            value={draftName}
                            onChangeText={setDraftName}
                            onBlur={commitRename}
                            onSubmitEditing={commitRename}
                            returnKeyType="done"
                            style={[styles.renameInput, { color: colors.text.primary, borderColor: meta.color }]}
                        />
                    ) : (
                        <>
                            <Text style={[styles.sessionName, { color: colors.text.primary }]} numberOfLines={1}>
                                {session.name}
                            </Text>
                            <Text style={[styles.sessionSub, { color: colors.text.tertiary }]}>
                                {meta.label} · {session.logs.length} item{session.logs.length !== 1 ? 's' : ''}
                            </Text>
                        </>
                    )}
                </View>

                {/* Kcal + chevron */}
                <View style={styles.headerRight}>
                    <Text style={[styles.kcalValue, { color: meta.color }]}>{session.totals.calories}</Text>
                    <Text style={[styles.kcalUnit, { color: colors.text.tertiary }]}>kcal</Text>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.text.disabled}
                        style={{ marginLeft: 6 }}
                    />
                </View>
            </TouchableOpacity>

            {/* ── Collapsed macro strip ── */}
            {!expanded && (
                <View style={styles.macroStrip}>
                    <MacroPill label="P" value={session.totals.protein} color={colors.nutrition?.protein ?? '#10B981'} />
                    <MacroPill label="C" value={session.totals.carbs}   color={colors.nutrition?.carbs   ?? '#F59E0B'} />
                    <MacroPill label="F" value={session.totals.fats}    color={colors.nutrition?.fats    ?? '#EF4444'} />
                </View>
            )}

            {/* ── Expanded body ── */}
            {expanded && (
                <View>
                    <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />

                    {session.logs.map((log, idx) => (
                        <View
                            key={log.id}
                            style={[
                                styles.logRow,
                                idx < session.logs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border.secondary },
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.logMain}
                                onPress={() => onEditLog?.(log)}
                                activeOpacity={0.65}
                            >
                                <Text style={[styles.logName, { color: colors.text.primary }]} numberOfLines={1}>
                                    {log.foodName}
                                </Text>
                                <Text style={[styles.logMacros, { color: colors.text.tertiary }]}>
                                    P {log.protein}g · C {log.carbs}g · F {log.fats}g
                                </Text>
                            </TouchableOpacity>
                            <Text style={[styles.logCal, { color: colors.text.secondary }]}>{log.calories}</Text>
                            <Text style={[styles.logCalUnit, { color: colors.text.disabled }]}>kcal</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    onDeleteLog(log.id);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}
                                style={{ marginLeft: 10 }}
                            >
                                <Ionicons name="trash-outline" size={15} color={colors.status?.error ?? '#EF4444'} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Macro summary */}
                    <View style={[styles.macroSummary, { backgroundColor: colors.background.elevated }]}>
                        <MacroPill label="Protein" value={session.totals.protein} color={colors.nutrition?.protein ?? '#10B981'} />
                        <MacroPill label="Carbs"   value={session.totals.carbs}   color={colors.nutrition?.carbs   ?? '#F59E0B'} />
                        <MacroPill label="Fats"    value={session.totals.fats}    color={colors.nutrition?.fats    ?? '#EF4444'} />
                    </View>

                    {/* Add more button */}
                    <TouchableOpacity
                        style={[styles.addMoreBtn, { borderColor: colors.accent.primary + '55' }]}
                        onPress={() => onAddMore(session.id, session.mealType)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add-circle-outline" size={16} color={colors.accent.primary} />
                        <Text style={[styles.addMoreText, { color: colors.accent.primary }]}>
                            Add more to this meal
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={[macroStyles.pill, { backgroundColor: color + '18' }]}>
            <Text style={[macroStyles.label, { color }]}>{label}</Text>
            <Text style={[macroStyles.value, { color }]}>{value}g</Text>
        </View>
    );
}

const macroStyles = StyleSheet.create({
    pill:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    label: { fontSize: 11, fontWeight: '700' },
    value: { fontSize: 12, fontWeight: '800' },
});

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 10,
    },
    typeIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    headerCenter: {
        flex: 1,
    },
    sessionName: {
        fontSize: 15,
        fontWeight: '700',
    },
    sessionSub: {
        fontSize: 11,
        marginTop: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
        flexDirection: 'row',
        gap: 2,
    },
    kcalValue: {
        fontSize: 17,
        fontWeight: '800',
    },
    kcalUnit: {
        fontSize: 11,
        alignSelf: 'flex-end',
        marginBottom: 1,
    },
    renameInput: {
        fontSize: 15,
        fontWeight: '700',
        borderBottomWidth: 1.5,
        paddingVertical: 2,
        paddingHorizontal: 0,
    },
    macroStrip: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 14,
        paddingBottom: 12,
    },
    divider: {
        height: 1,
        marginHorizontal: 14,
    },
    logRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    logMain: {
        flex: 1,
        marginRight: 8,
    },
    logName: {
        fontSize: 14,
        fontWeight: '600',
    },
    logMacros: {
        fontSize: 11,
        marginTop: 2,
    },
    logCal: {
        fontSize: 14,
        fontWeight: '700',
    },
    logCalUnit: {
        fontSize: 10,
        marginLeft: 2,
        alignSelf: 'flex-end',
        marginBottom: 1,
    },
    macroSummary: {
        flexDirection: 'row',
        gap: 6,
        margin: 12,
        padding: 10,
        borderRadius: 12,
        justifyContent: 'center',
    },
    addMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginHorizontal: 14,
        marginBottom: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    addMoreText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
