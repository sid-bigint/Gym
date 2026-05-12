import { MuscleRecoveryTracker, RecoveryData } from '@/components/MuscleRecoveryTracker';
import { MuscleVisualizer } from '@/components/MuscleVisualizer';
import { MuscleProgressChart, WeeklyMuscleHeatmap } from '@/components/MuscleVisualizerCard';
import MuscleRepository from '@/repositories/MuscleRepository';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import useMuscleStore, { MuscleData, MuscleGroup } from '@/store/useMuscleStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useTheme } from '@/store/useTheme';
import { getMuscleGroupsForExercise } from '@/services/muscleCalculationService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const MuscleVisualizerScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { user } = useUserStore();
    const userId = user?.id;
    const storeMuscleData = useMuscleStore(state => state.muscleData);
    const storeWeeklyData = useMuscleStore(state => state.weeklyData);
    const setMuscleDataStore = useMuscleStore(state => state.setMuscleData);
    const setWeeklyDataStore = useMuscleStore(state => state.setWeeklyData);
    const activeWorkout = useWorkoutStore(state => state.activeWorkout);
    const exercises = useWorkoutStore(state => state.exercises);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'visualizer' | 'recovery' | 'analytics'>('visualizer');
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

    const mergedMuscleData = useMemo(() => {
        const merged = new Map(storeMuscleData);

        storeWeeklyData.forEach((volumes, muscle) => {
            const weeklyVolume = volumes.reduce((a, b) => a + b, 0);
            if (weeklyVolume > 0 && !merged.has(muscle as MuscleGroup)) {
                const intensity = Math.min(10, weeklyVolume / 100);
                merged.set(muscle as MuscleGroup, {
                    group: muscle as MuscleGroup, volume: 0, setCount: 0, repCount: 0,
                    intensity,
                    soreness: 0, recoveryStatus: 'FRESH',
                    lastTrainedDate: new Date().toISOString(), restDaysSince: 0,
                    color: useMuscleStore.getState().getMuscleColor(muscle as MuscleGroup, intensity, 0)
                });
            }
        });

        if (activeWorkout && activeWorkout.activeSets && activeWorkout.activeSets.length > 0) {
            activeWorkout.activeSets.filter((s: any) => s.completed).forEach((setData: any) => {
                const ex = exercises.find((e: any) => e.id === setData.exerciseId);
                const muscles = getMuscleGroupsForExercise(setData.exerciseName || ex?.name || '', ex?.muscleGroup || '');
                const volume = (Number(setData.weight) || 0) * (Number(setData.reps) || 0);
                muscles.forEach((muscle: MuscleGroup) => {
                    const existing = merged.get(muscle) || { group: muscle, volume: 0, setCount: 0, repCount: 0, intensity: 0, soreness: 0, recoveryStatus: 'FRESH' as any, lastTrainedDate: new Date().toISOString(), restDaysSince: 0, color: '#64748b' };
                    const newVolume = existing.volume + volume;
                    merged.set(muscle, { ...existing, volume: newVolume, setCount: existing.setCount + 1, repCount: existing.repCount + (Number(setData.reps) || 0), intensity: Math.min(10, Math.max(existing.intensity, newVolume / 50)), color: useMuscleStore.getState().getMuscleColor(muscle, Math.min(10, newVolume / 50), existing.soreness) });
                });
            });
        }
        return merged;
    }, [storeMuscleData, storeWeeklyData, activeWorkout, exercises]);

    const recoveryInitialData = useMemo(() => {
        const data: RecoveryData = {};
        mergedMuscleData.forEach((muscle, group) => {
            data[group] = {
                soreness: muscle.soreness,
                recoveryStatus: muscle.recoveryStatus
            };
        });
        return data;
    }, [mergedMuscleData]);

    const loadMuscleData = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const userIdStr = String(userId);
            const todayStats = await MuscleRepository.getTodaysMuscleStats(userIdStr);
            setMuscleDataStore(todayStats);
            
            const weekly = await MuscleRepository.getWeeklyMuscleStats(userIdStr);
            setWeeklyDataStore(weekly);
        } catch (error) {
            console.error('Error loading muscle data:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, setMuscleDataStore, setWeeklyDataStore]);

    useFocusEffect(
        useCallback(() => {
            loadMuscleData();
        }, [loadMuscleData])
    );

    const handleRecoverySave = useCallback(async (data: RecoveryData) => {
        if (!userId) return;
        try {
            setLoading(true);
            const today = format(new Date(), 'yyyy-MM-dd');
            const userIdStr = String(userId);

            for (const [muscleGroup, recoveryInfo] of Object.entries(data)) {
                await MuscleRepository.saveMuscleRecovery({
                    userId: userIdStr,
                    muscleGroup: muscleGroup as MuscleGroup,
                    date: today,
                    soreness: recoveryInfo.soreness,
                    recoveryStatus: recoveryInfo.recoveryStatus,
                });
            }
            await loadMuscleData();
        } catch (error) {
            console.error('Error saving recovery data:', error);
            Alert.alert('Error', 'Failed to save recovery data');
        } finally {
            setLoading(false);
        }
    }, [userId, loadMuscleData]);

    const renderLegend = () => (
        <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.legendText}>Growth (New PR)</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                <Text style={styles.legendText}>Maintenance</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Stalled (No PR)</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f87171' }]} />
                <Text style={styles.legendText}>Sore/Fatigued</Text>
            </View>
        </View>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'visualizer':
                return (
                    <View style={styles.tabContent}>
                        <MuscleVisualizer 
                            muscleData={mergedMuscleData} 
                            onMuscleSelect={setSelectedMuscle}
                        />
                        {renderLegend()}
                        {selectedMuscle && mergedMuscleData.has(selectedMuscle) && (
                            <View style={styles.quickStatsRow}>
                                <View style={[styles.quickStatCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                                    <Text style={[styles.quickStatValue, { color: colors.text.primary }]}>
                                        {mergedMuscleData.get(selectedMuscle)?.volume.toFixed(0)}
                                        <Text style={[styles.quickStatUnit, { color: colors.text.tertiary }]}> kg</Text>
                                    </Text>
                                    <Text style={[styles.quickStatLabel, { color: colors.text.tertiary }]}>Today's Volume</Text>
                                </View>
                                <View style={[styles.quickStatCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                                    <Text style={[styles.quickStatValue, { color: colors.text.primary }]}>
                                        {mergedMuscleData.get(selectedMuscle)?.setCount}
                                    </Text>
                                    <Text style={[styles.quickStatLabel, { color: colors.text.tertiary }]}>Sets</Text>
                                </View>
                            </View>
                        )}
                    </View>
                );
            case 'recovery':
                return (
                    <View style={styles.tabContent}>
                        <MuscleRecoveryTracker 
                            initialData={recoveryInitialData}
                            muscleData={mergedMuscleData} 
                            onSave={handleRecoverySave} 
                        />
                    </View>
                );
            case 'analytics':
                return (
                    <View style={styles.tabContent}>
                        <WeeklyMuscleHeatmap weeklyData={storeWeeklyData} />
                        <View style={{ height: 20 }} />
                        <MuscleProgressChart 
                            muscleData={new Map(Array.from(storeWeeklyData.entries()).map(([mg, volumes]) => {
                                const vol = volumes.reduce((a, b) => a + b, 0);
                                return [
                                    mg as MuscleGroup, 
                                    { 
                                        group: mg as MuscleGroup, 
                                        volume: vol,
                                        color: useMuscleStore.getState().getMuscleColor(mg as MuscleGroup, vol / 100, 0),
                                        setCount: 0,
                                        repCount: 0,
                                        intensity: vol / 100,
                                        soreness: 0,
                                        recoveryStatus: 'FRESH' as const,
                                        lastTrainedDate: new Date().toISOString(),
                                        restDaysSince: 0
                                    }
                                ];
                            }))} 
                        />
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Muscle Intelligence</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>Real-time anatomical tracking</Text>
                </View>
                {loading && <ActivityIndicator size="small" color={colors.accent.primary} />}
            </View>

            <View style={[styles.tabBar, { backgroundColor: colors.background.elevated, borderColor: colors.border.secondary }]}>
                {[
                    { id: 'visualizer', label: 'Visualization', icon: 'human' },
                    { id: 'recovery', label: 'Recovery', icon: 'shield-check' },
                    { id: 'analytics', label: 'Analytics', icon: 'chart-box' },
                ].map(tab => (
                    <Pressable
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id as any)}
                        style={[
                            styles.tabItem,
                            activeTab === tab.id && { backgroundColor: colors.accent.primary }
                        ]}
                    >
                        <MaterialCommunityIcons 
                            name={tab.icon as any} 
                            size={18} 
                            color={activeTab === tab.id ? '#fff' : colors.text.tertiary} 
                        />
                        <Text style={[
                            styles.tabLabel,
                            { color: activeTab === tab.id ? '#fff' : colors.text.tertiary }
                        ]}>
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <ScrollView 
                style={styles.mainScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderTabContent()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 4,
        gap: 4,
        borderWidth: 1,
    },
    tabItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '700',
    },
    mainScroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    tabContent: {
        flex: 1,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        gap: 15,
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
    },
    quickStatsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    quickStatCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    quickStatValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    quickStatUnit: {
        fontSize: 12,
        fontWeight: '600',
    },
    quickStatLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 4,
    },
});

export default MuscleVisualizerScreen;
