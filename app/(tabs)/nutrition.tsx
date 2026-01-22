import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useNutritionStore, NutritionLog } from '../../src/store/useNutritionStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useTheme } from '../../src/store/useTheme';
import { useScreenPadding } from '../../src/store/useScreenPadding';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { format, addDays, isSameDay } from 'date-fns';

export default function NutritionScreen() {
    const { logs, totals, loadLogs, deleteLog, updateLog, selectedDate, setDate } = useNutritionStore();
    const { user, loadUser } = useUserStore();
    const { colors } = useTheme();
    const { contentTop } = useScreenPadding();

    const [editingLog, setEditingLog] = useState<NutritionLog | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Form state for editing
    const [editForm, setEditForm] = useState({
        foodName: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        mealType: 'snack' as 'breakfast' | 'lunch' | 'dinner' | 'snack'
    });

    useEffect(() => {
        loadLogs();
        if (!user) loadUser();
    }, []);

    const handleEdit = (log: NutritionLog) => {
        setEditingLog(log);
        setEditForm({
            foodName: log.foodName,
            calories: log.calories.toString(),
            protein: log.protein.toString(),
            carbs: log.carbs.toString(),
            fats: log.fats.toString(),
            mealType: log.mealType
        });
    };

    const handleSaveEdit = async () => {
        if (!editingLog) return;
        try {
            await updateLog({
                ...editingLog,
                foodName: editForm.foodName,
                calories: Number(editForm.calories),
                protein: Number(editForm.protein),
                carbs: Number(editForm.carbs),
                fats: Number(editForm.fats),
                mealType: editForm.mealType
            });
            setEditingLog(null);
        } catch (error) {
            console.error("Failed to update log", error);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteLog(deleteId);
            setDeleteId(null);
        }
    };

    const getProgress = (current: number, target: number) => {
        if (!target) return 0;
        return Math.min(current / target, 1);
    };

    const renderProgressBar = (label: string, current: number, target: number, colorKey: 'protein' | 'carbs' | 'fats' | 'calories') => (
        <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.text.primary }]}>{label}</Text>
                <Text style={[styles.progressValue, { color: colors.text.tertiary }]}>{current} / {target} {label === 'Calories' ? 'kcal' : 'g'}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.background.secondary }]}>
                <View style={[styles.fill, { width: `${getProgress(current, target) * 100}%`, backgroundColor: colors.nutrition[colorKey] }]} />
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: contentTop }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text.primary }]}>Nutrition</Text>
                <TouchableOpacity onPress={() => router.push('/nutrition/add')}>
                    <Ionicons name="add-circle" size={40} color={colors.accent.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Summary Card */}
                <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                    {renderProgressBar('Calories', totals.calories, user?.calorieGoal || 2000, 'calories')}
                    <View style={{ height: 16 }} />
                    {renderProgressBar('Protein', totals.protein, user?.targetProtein || 150, 'protein')}
                    <View style={{ height: 12 }} />
                    {renderProgressBar('Carbs', totals.carbs, user?.targetCarbs || 200, 'carbs')}
                    <View style={{ height: 12 }} />
                    {renderProgressBar('Fats', totals.fats, user?.targetFats || 70, 'fats')}
                </View>

                <View style={[styles.dateNavigator, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                    <TouchableOpacity onPress={() => setDate(addDays(selectedDate, -1))}>
                        <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <View style={styles.dateInfo}>
                        <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
                        <Text style={[styles.dateText, { color: colors.text.primary }]}>
                            {isSameDay(selectedDate, new Date())
                                ? "Today"
                                : isSameDay(selectedDate, addDays(new Date(), -1))
                                    ? "Yesterday"
                                    : format(selectedDate, 'MMMM do, yyyy')}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setDate(addDays(selectedDate, 1))}>
                        <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    {isSameDay(selectedDate, new Date()) ? "Today's Logs" : `Logs for ${format(selectedDate, 'MMM do')}`}
                </Text>
                {logs.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.text.disabled }]}>No meals logged yet today.</Text>
                ) : (
                    logs.map(log => (
                        <View key={log.id} style={[styles.logItem, { backgroundColor: colors.background.card, borderLeftColor: colors.nutrition[log.mealType === 'breakfast' ? 'protein' : log.mealType === 'lunch' ? 'carbs' : log.mealType === 'dinner' ? 'fats' : 'calories'] || colors.accent.primary }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.logName, { color: colors.text.primary }]}>{log.foodName}</Text>
                                <Text style={[styles.logSub, { color: colors.text.tertiary }]}>{log.mealType.charAt(0).toUpperCase() + log.mealType.slice(1)} • {log.calories} kcal</Text>
                            </View>
                            <View style={styles.logActions}>
                                <TouchableOpacity onPress={() => handleEdit(log)} style={[styles.actionButton, { backgroundColor: colors.background.elevated }]}>
                                    <Ionicons name="pencil" size={18} color={colors.text.secondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(log.id)} style={[styles.actionButton, { backgroundColor: colors.background.elevated, marginLeft: 8 }]}>
                                    <Ionicons name="trash-outline" size={18} color={colors.accent.warning} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                visible={!!editingLog}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditingLog(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border.secondary }]}>
                            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Edit Log</Text>
                            <TouchableOpacity onPress={() => setEditingLog(null)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
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

                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent.primary }]} onPress={handleSaveEdit}>
                                <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>Save Changes</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={!!deleteId}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteId(null)}
            >
                <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
                    <View style={[styles.confirmModal, { backgroundColor: colors.background.elevated }]}>
                        <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>Delete Log?</Text>
                        <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
                            Are you sure you want to remove this entry?
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.background.card }]}
                                onPress={() => setDeleteId(null)}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.accent.warning }]}
                                onPress={confirmDelete}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
    },
    progressContainer: {
        width: '100%',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontWeight: 'bold',
    },
    progressValue: {},
    track: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    dateNavigator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
    },
    logItem: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
    },
    logName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    logSub: {
        marginTop: 4,
    },
    macrosBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    macroText: {
        fontWeight: 'bold',
    },
    emptyText: {
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    logActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 24,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    col: {
        flex: 1,
    },
    saveButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmModal: {
        width: '80%',
        padding: 24,
        borderRadius: 20,
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    confirmText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
