import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useNutritionStore } from '../../src/store/useNutritionStore';
import { useProgressStore } from '../../src/store/useProgressStore';
import { useTheme } from '../../src/store/useTheme';
import { useScreenPadding } from '../../src/store/useScreenPadding';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../../src/constants/theme';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProgressScreen() {
    const { getWorkoutHistory } = useWorkoutStore();
    const { getNutritionHistory } = useNutritionStore();
    const { measurements, loadMeasurements } = useProgressStore();
    const { colors } = useTheme();
    const { contentTop } = useScreenPadding();
    const styles = useMemo(() => createStyles(colors, contentTop), [colors, contentTop]);

    const [workouts, setWorkouts] = useState<any[]>([]);
    const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'history' | 'insights'>('history');
    const [subViewMode, setSubViewMode] = useState<'workout' | 'nutrition' | 'body'>('workout');

    const loadHistory = async () => {
        setIsLoading(true);
        const [wHistory, nHistory] = await Promise.all([
            getWorkoutHistory(50),
            getNutritionHistory(7),
            loadMeasurements()
        ]);
        setWorkouts(wHistory);
        setNutritionHistory(nHistory);
        setIsLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        const [wHistory, nHistory] = await Promise.all([
            getWorkoutHistory(50),
            getNutritionHistory(7),
            loadMeasurements()
        ]);
        setWorkouts(wHistory);
        setNutritionHistory(nHistory);
        setRefreshing(false);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const chartData = useMemo(() => {
        if (workouts.length === 0) return null;
        const last7 = [...workouts].reverse().slice(-7);
        return {
            labels: last7.map(w => format(new Date(w.date), 'MM/dd')),
            datasets: [{
                data: last7.map(w => (w.volume || 0) / 1000)
            }]
        };
    }, [workouts]);

    const nutritionCharts = useMemo(() => {
        // Generate last 7 days labels
        const labels = Array.from({ length: 7 }, (_, i) => {
            return format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        });

        const caloriesData = labels.map(day => {
            const entry = nutritionHistory.find(n => n.date === day);
            return entry ? entry.calories || 0 : 0;
        });

        const proteinData = labels.map(day => {
            const entry = nutritionHistory.find(n => n.date === day);
            return entry ? entry.protein || 0 : 0;
        });

        const displayLabels = labels.map(l => format(new Date(l), 'MM/dd'));

        return {
            calories: {
                labels: displayLabels,
                datasets: [{ data: caloriesData }]
            },
            protein: {
                labels: displayLabels,
                datasets: [{ data: proteinData }]
            }
        };
    }, [nutritionHistory]);

    const bodyCharts = useMemo(() => {
        const labels = Array.from({ length: 7 }, (_, i) => {
            return format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        });

        const weightData = labels.map(day => {
            const entry = measurements.find(m => isSameDay(new Date(m.date), new Date(day)));
            if (entry) return entry.weight;

            // If no exact match, find the closest previous weight if any
            const prev = [...measurements]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .find(m => new Date(m.date).getTime() < new Date(day).getTime());
            return prev ? prev.weight : (measurements[0]?.weight || 0);
        });

        const hasValidData = weightData.some(v => v > 0);

        return {
            weight: {
                labels: labels.map(l => format(new Date(l), 'MM/dd')),
                datasets: [{ data: weightData }]
            },
            hasValidData
        };
    }, [measurements]);

    const stats = useMemo(() => {
        const totalVolume = workouts.reduce((acc, w) => acc + (w.volume || 0), 0);
        const totalDuration = workouts.reduce((acc, w) => acc + (w.duration || 0), 0);

        const avgCalories = nutritionHistory.length > 0
            ? (nutritionHistory.reduce((acc, n) => acc + (n.calories || 0), 0) / nutritionHistory.length).toFixed(0)
            : '0';
        const avgProtein = nutritionHistory.length > 0
            ? (nutritionHistory.reduce((acc, n) => acc + (n.protein || 0), 0) / nutritionHistory.length).toFixed(1)
            : '0';

        const currentWeight = measurements[0]?.weight || 0;
        const prevWeight = measurements[1]?.weight || currentWeight;
        const weightChange = currentWeight - prevWeight;

        return {
            totalWorkouts: workouts.length,
            avgDuration: workouts.length > 0 ? (totalDuration / workouts.length).toFixed(0) : '0',
            totalVolume: (totalVolume / 1000).toFixed(1),
            avgCalories,
            avgProtein,
            currentWeight,
            weightChange: weightChange.toFixed(1)
        };
    }, [workouts, nutritionHistory, measurements]);

    const renderWorkoutItem = ({ item }: { item: any }) => {
        const date = new Date(item.date);

        return (
            <TouchableOpacity
                style={styles.workoutCard}
                onPress={() => router.push({ pathname: '/workout/summary', params: { id: item.id } })}
            >
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.workoutName}>{item.routineName || 'Quick Workout'}</Text>
                        <Text style={styles.workoutDate}>{format(date, 'MMM d, yyyy • h:mm a')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={14} color={colors.accent.primary} />
                        <Text style={styles.statText}>{item.duration} min</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="barbell-outline" size={14} color={colors.accent.secondary} />
                        <Text style={styles.statText}>{((item.volume || 0) / 1000).toFixed(1)}k kg</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="list-outline" size={14} color={colors.accent.primary} />
                        <Text style={styles.statText}>{item.exercises?.length || 0} exercises</Text>
                    </View>
                </View>

                <View style={styles.exercisesPreview}>
                    <Text style={styles.exercisesText} numberOfLines={1}>
                        {item.exercises?.join(', ') || 'No exercises logged'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading && workouts.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Progress</Text>
                <View style={[styles.toggleContainer, { backgroundColor: colors.background.elevated }]}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'history' && { backgroundColor: colors.background.card }]}
                        onPress={() => setViewMode('history')}
                    >
                        <Text style={[styles.toggleText, viewMode === 'history' && { color: colors.accent.primary }]}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'insights' && { backgroundColor: colors.background.card }]}
                        onPress={() => setViewMode('insights')}
                    >
                        <Text style={[styles.toggleText, viewMode === 'insights' && { color: colors.accent.primary }]}>Insights</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {viewMode === 'history' ? (
                <FlatList
                    data={workouts}
                    renderItem={renderWorkoutItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={64} color={colors.text.disabled} />
                            <Text style={styles.emptyText}>No workouts recorded yet.</Text>
                            <TouchableOpacity
                                style={styles.startBtn}
                                onPress={() => router.navigate('/(tabs)/routines')}
                            >
                                <Text style={styles.startBtnText}>Go to Routines</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            ) : (
                <ScrollView contentContainerStyle={styles.insightsContent} showsVerticalScrollIndicator={false}>
                    {/* Secondary Toggle for Insights Categories */}
                    <View style={styles.subToggleContainer}>
                        <TouchableOpacity
                            onPress={() => setSubViewMode('workout')}
                            style={[styles.subToggleBtn, subViewMode === 'workout' && { backgroundColor: colors.accent.primary + '15', borderColor: colors.accent.primary }]}
                        >
                            <Ionicons name="barbell" size={18} color={subViewMode === 'workout' ? colors.accent.primary : colors.text.tertiary} />
                            <Text style={[styles.subToggleText, subViewMode === 'workout' && { color: colors.accent.primary }]}>Lift</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSubViewMode('nutrition')}
                            style={[styles.subToggleBtn, subViewMode === 'nutrition' && { backgroundColor: colors.accent.secondary + '15', borderColor: colors.accent.secondary }]}
                        >
                            <Ionicons name="nutrition" size={18} color={subViewMode === 'nutrition' ? colors.accent.secondary : colors.text.tertiary} />
                            <Text style={[styles.subToggleText, subViewMode === 'nutrition' && { color: colors.accent.secondary }]}>Food</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSubViewMode('body')}
                            style={[styles.subToggleBtn, subViewMode === 'body' && { backgroundColor: colors.accent.success + '15', borderColor: colors.accent.success }]}
                        >
                            <Ionicons name="speedometer" size={18} color={subViewMode === 'body' ? colors.accent.success : colors.text.tertiary} />
                            <Text style={[styles.subToggleText, subViewMode === 'body' && { color: colors.accent.success }]}>Body</Text>
                        </TouchableOpacity>
                    </View>

                    {subViewMode === 'workout' && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="stats-chart" size={20} color={colors.accent.primary} />
                                <Text style={styles.sectionTitle}>Training Performance</Text>
                            </View>

                            {stats && (
                                <View style={styles.statsGrid}>
                                    <View style={[styles.miniStatCard, { backgroundColor: colors.background.card, borderColor: colors.accent.primary + '20' }]}>
                                        <Text style={styles.miniStatValue}>{stats.totalWorkouts}</Text>
                                        <Text style={styles.miniStatLabel}>Workouts</Text>
                                    </View>
                                    <View style={[styles.miniStatCard, { backgroundColor: colors.background.card, borderColor: colors.accent.primary + '20' }]}>
                                        <Text style={styles.miniStatValue}>{stats.avgDuration}m</Text>
                                        <Text style={styles.miniStatLabel}>Avg Time</Text>
                                    </View>
                                    <View style={[styles.miniStatCard, { backgroundColor: colors.background.card, borderColor: colors.accent.primary + '20' }]}>
                                        <Text style={styles.miniStatValue}>{stats.totalVolume}k</Text>
                                        <Text style={styles.miniStatLabel}>Tot. Tonnes</Text>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.chartTitle}>Training Volume (kg)</Text>
                            {chartData ? (
                                <LineChart
                                    data={chartData}
                                    width={SCREEN_WIDTH - 40}
                                    height={200}
                                    chartConfig={{
                                        backgroundColor: colors.background.primary,
                                        backgroundGradientFrom: colors.background.card,
                                        backgroundGradientTo: colors.background.card,
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                                        labelColor: (opacity = 1) => colors.text.tertiary,
                                        style: { borderRadius: 16 },
                                        propsForDots: { r: "4", strokeWidth: "2", stroke: colors.accent.primary }
                                    }}
                                    bezier
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                />
                            ) : (
                                <View style={styles.emptyChart}>
                                    <Ionicons name="analytics" size={48} color={colors.text.disabled} />
                                    <Text style={styles.emptyText}>Track workouts to see volume trends</Text>
                                </View>
                            )}
                        </>
                    )}

                    {subViewMode === 'nutrition' && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="flame" size={20} color={colors.accent.secondary} />
                                <Text style={styles.sectionTitle}>Nutrition Summary</Text>
                            </View>

                            {stats && (
                                <View style={styles.statsGrid}>
                                    <View style={[styles.miniStatCard, { backgroundColor: colors.background.card, borderColor: colors.accent.secondary + '20' }]}>
                                        <Text style={[styles.miniStatValue, { color: colors.accent.secondary }]}>{stats.avgCalories}</Text>
                                        <Text style={styles.miniStatLabel}>Avg Calories</Text>
                                    </View>
                                    <View style={[styles.miniStatCard, { backgroundColor: colors.background.card, borderColor: colors.accent.secondary + '20' }]}>
                                        <Text style={[styles.miniStatValue, { color: colors.accent.secondary }]}>{stats.avgProtein}g</Text>
                                        <Text style={styles.miniStatLabel}>Avg Protein</Text>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.chartTitle}>Daily Calories</Text>
                            {nutritionCharts?.calories ? (
                                <LineChart
                                    data={nutritionCharts.calories}
                                    width={SCREEN_WIDTH - 40}
                                    height={200}
                                    chartConfig={{
                                        backgroundColor: colors.background.primary,
                                        backgroundGradientFrom: colors.background.card,
                                        backgroundGradientTo: colors.background.card,
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(167, 139, 250, ${opacity})`,
                                        labelColor: (opacity = 1) => colors.text.tertiary,
                                        style: { borderRadius: 16 },
                                        propsForDots: { r: "4", strokeWidth: "2", stroke: colors.accent.secondary }
                                    }}
                                    bezier
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                />
                            ) : (
                                <View style={styles.emptyChart}>
                                    <Ionicons name="nutrition" size={48} color={colors.text.disabled} />
                                    <Text style={styles.emptyText}>Log food to see calorie trends</Text>
                                </View>
                            )}

                            <Text style={[styles.chartTitle, { marginTop: 24 }]}>Protein Intake (g)</Text>
                            {nutritionCharts?.protein ? (
                                <LineChart
                                    data={nutritionCharts.protein}
                                    width={SCREEN_WIDTH - 40}
                                    height={180}
                                    chartConfig={{
                                        backgroundColor: colors.background.primary,
                                        backgroundGradientFrom: colors.background.card,
                                        backgroundGradientTo: colors.background.card,
                                        decimalPlaces: 1,
                                        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                                        labelColor: (opacity = 1) => colors.text.tertiary,
                                        style: { borderRadius: 16 },
                                        propsForDots: { r: "4", strokeWidth: "2", stroke: "#6366f1" }
                                    }}
                                    bezier
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                />
                            ) : (
                                <View style={styles.emptyChart}>
                                    <Ionicons name="water" size={48} color={colors.text.disabled} />
                                    <Text style={styles.emptyText}>Log protein to see trends</Text>
                                </View>
                            )}
                        </>
                    )}

                    {subViewMode === 'body' && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="speedometer" size={20} color={colors.accent.success} />
                                <Text style={styles.sectionTitle}>Body Trends</Text>
                            </View>

                            {stats && (
                                <View style={styles.statsGrid}>
                                    <View style={[styles.miniStatCard, { backgroundColor: colors.background.card, borderColor: colors.accent.success + '20' }]}>
                                        <Text style={[styles.miniStatValue, { color: colors.accent.success }]}>{stats.currentWeight}kg</Text>
                                        <Text style={styles.miniStatLabel}>Weight</Text>
                                    </View>
                                    <View style={[styles.miniStatCard, { backgroundColor: colors.background.card, borderColor: colors.accent.success + '20' }]}>
                                        <Text style={[styles.miniStatValue, { color: parseFloat(stats.weightChange) > 0 ? colors.accent.warning : colors.accent.success }]}>
                                            {parseFloat(stats.weightChange) > 0 ? '+' : ''}{stats.weightChange}
                                        </Text>
                                        <Text style={styles.miniStatLabel}>Trend</Text>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.chartTitle}>Weight Performance (kg)</Text>
                            {bodyCharts.hasValidData ? (
                                <LineChart
                                    data={bodyCharts.weight}
                                    width={SCREEN_WIDTH - 40}
                                    height={200}
                                    chartConfig={{
                                        backgroundColor: colors.background.primary,
                                        backgroundGradientFrom: colors.background.card,
                                        backgroundGradientTo: colors.background.card,
                                        decimalPlaces: 1,
                                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                        labelColor: (opacity = 1) => colors.text.tertiary,
                                        style: { borderRadius: 16 },
                                        propsForDots: { r: "4", strokeWidth: "2", stroke: colors.accent.success }
                                    }}
                                    bezier
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                />
                            ) : (
                                <View style={styles.emptyChart}>
                                    <Ionicons name="pulse" size={48} color={colors.text.disabled} />
                                    <Text style={styles.emptyText}>Log your weight to see progress charts</Text>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const createStyles = (colors: any, contentTop: number) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        paddingHorizontal: spacing.xl,
        paddingTop: contentTop,
        paddingBottom: spacing.lg,
        backgroundColor: colors.background.primary,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text.primary,
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        gap: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text.tertiary,
    },
    listContent: {
        padding: spacing.xl,
        paddingBottom: 100,
    },
    workoutCard: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border.secondary,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    workoutName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
    },
    workoutDate: {
        fontSize: 13,
        color: colors.text.tertiary,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.secondary,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 13,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    exercisesPreview: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    exercisesText: {
        fontSize: 12,
        color: colors.text.tertiary,
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 14,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: 10,
    },
    startBtn: {
        backgroundColor: colors.accent.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: borderRadius.full,
        marginTop: 20,
    },
    startBtnText: {
        color: colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 15,
    },
    insightsContent: {
        padding: spacing.xl,
        paddingBottom: 100,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    miniStatCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    miniStatValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text.primary,
    },
    miniStatLabel: {
        fontSize: 11,
        color: colors.text.tertiary,
        fontWeight: '600',
        marginTop: 4,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 12,
        paddingLeft: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text.primary,
    },
    subToggleContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background.elevated,
        padding: 4,
        borderRadius: 14,
        marginBottom: 24,
        gap: 6,
    },
    subToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    subToggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text.tertiary,
    },
    emptyChart: {
        height: 200,
        backgroundColor: colors.background.card,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.border.primary,
        marginVertical: 8,
    },
});
