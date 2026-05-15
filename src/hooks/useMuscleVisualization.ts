import MuscleRepository from '@/repositories/MuscleRepository';
import { useAuthStore } from '@/store/useAuthStore';
import useMuscleStore, { MuscleGroup } from '@/store/useMuscleStore';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for managing and accessing muscle visualization data
 * Handles loading, caching, and updates automatically
 */
export function useMuscleVisualization() {
    const { user } = useAuthStore();
    const userId = user?.id;
    const muscleStore = useMuscleStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    /**
     * Load today's muscle data
     */
    const loadTodayData = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);

            const data = await MuscleRepository.getTodaysMuscleStats(userId);
            muscleStore.setMuscleData(data);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load muscle data');
            console.error('Error loading muscle data:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, muscleStore]);

    /**
     * Load weekly analytics
     */
    const loadWeeklyData = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const data = await MuscleRepository.getWeeklyMuscleStats(userId);
            muscleStore.setWeeklyData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load weekly data');
            console.error('Error loading weekly data:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, muscleStore]);

    /**
     * Load both today and weekly data
     */
    const loadAllData = useCallback(async () => {
        await Promise.all([loadTodayData(), loadWeeklyData()]);
    }, [loadTodayData, loadWeeklyData]);

    /**
     * Refresh all data
     */
    const refresh = useCallback(async () => {
        await loadAllData();
    }, [loadAllData]);

    /**
     * Get most worked muscles (sorted by volume)
     */
    const getMostWorkedMuscles = useCallback((limit: number = 3): MuscleGroup[] => {
        return Array.from(muscleStore.muscleData.entries())
            .filter(([_, data]: any) => data.volume > 0)
            .sort((a: any, b: any) => b[1].volume - a[1].volume)
            .slice(0, limit)
            .map(([muscle]: any) => muscle);
    }, [muscleStore.muscleData]);

    /**
     * Get total volume for today
     */
    const getTotalVolume = useCallback((): number => {
        return Array.from(muscleStore.muscleData.values()).reduce((sum, data: any) => sum + data.volume, 0);
    }, [muscleStore.muscleData]);

    /**
     * Get total sets for today
     */
    const getTotalSets = useCallback((): number => {
        return Array.from(muscleStore.muscleData.values()).reduce((sum, data: any) => sum + data.setCount, 0);
    }, [muscleStore.muscleData]);

    /**
     * Get average intensity
     */
    const getAverageIntensity = useCallback((): number => {
        const muscles = Array.from(muscleStore.muscleData.values());
        if (muscles.length === 0) return 0;
        const total = muscles.reduce((sum, data: any) => sum + data.intensity, 0) as number;
        return Math.round(total / muscles.length);
    }, [muscleStore.muscleData]);

    /**
     * Get maximum soreness
     */
    const getMaxSoreness = useCallback((): { muscle: MuscleGroup; soreness: number } | null => {
        let max: { muscle: MuscleGroup; soreness: number } | null = null;
        muscleStore.muscleData.forEach((data: any, muscle: any) => {
            if (data.soreness > (max?.soreness || 0)) {
                max = { muscle, soreness: data.soreness };
            }
        });
        return max;
    }, [muscleStore.muscleData]);

    /**
     * Get muscles sorted by soreness
     */
    const getMuscleBySoreness = useCallback((limit?: number): { muscle: MuscleGroup; soreness: number }[] => {
        const sorted = Array.from(muscleStore.muscleData.entries())
            .filter(([_, data]: any) => data.soreness > 0)
            .map(([muscle, data]: any) => ({ muscle, soreness: data.soreness }))
            .sort((a: any, b: any) => b.soreness - a.soreness);

        return limit ? sorted.slice(0, limit) : sorted;
    }, [muscleStore.muscleData]);

    /**
     * Get muscles that need recovery
     */
    const getMusclesNeedingRecovery = useCallback((): MuscleGroup[] => {
        return Array.from(muscleStore.muscleData.entries())
            .filter(([_, data]: any) => data.recoveryStatus === 'SORE' || data.recoveryStatus === 'FATIGUED')
            .map(([muscle]: any) => muscle);
    }, [muscleStore.muscleData]);

    /**
     * Check if a specific muscle is worked today
     */
    const isMuscleWorkedToday = useCallback((muscle: MuscleGroup): boolean => {
        return (muscleStore.muscleData.get(muscle)?.volume || 0) > 0;
    }, [muscleStore.muscleData]);

    /**
     * Get intensity level description
     */
    const getIntensityDescription = useCallback((intensity: number): string => {
        if (intensity === 0) return 'Not worked';
        if (intensity < 3) return 'Light';
        if (intensity < 6) return 'Moderate';
        if (intensity < 8) return 'High';
        return 'Very High';
    }, []);

    /**
     * Get recovery status description
     */
    const getRecoveryDescription = useCallback((status: string): string => {
        const descriptions: Record<string, string> = {
            FRESH: 'Ready for intense training',
            RECOVERING: 'Can train with lighter volume',
            FATIGUED: 'Reduce training volume',
            SORE: 'Consider rest or light training',
        };
        return descriptions[status] || 'Unknown';
    }, []);

    // Load data on mount
    useEffect(() => {
        if (userId) {
            loadAllData();
        }
    }, [userId, loadAllData]);

    return {
        // State
        muscleData: muscleStore.muscleData,
        selectedMuscle: muscleStore.selectedMuscle,
        weeklyData: muscleStore.weeklyData,
        loading,
        error,
        lastUpdated,

        // Actions
        setSelectedMuscle: muscleStore.setSelectedMuscle,
        setViewMode: muscleStore.setViewMode,
        refresh,
        loadTodayData,
        loadWeeklyData,

        // Computed values
        getMostWorkedMuscles,
        getTotalVolume,
        getTotalSets,
        getAverageIntensity,
        getMaxSoreness,
        getMuscleBySoreness,
        getMusclesNeedingRecovery,
        isMuscleWorkedToday,
        getIntensityDescription,
        getRecoveryDescription,
    };
}

/**
 * Hook for managing recovery tracking
 */
export function useMuscleRecovery() {
    const { user } = useAuthStore();
    const userId = user?.id;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const saveRecoveryData = useCallback(
        async (muscleGroup: MuscleGroup, soreness: number, status: 'FRESH' | 'FATIGUED' | 'SORE' | 'RECOVERING') => {
            if (!userId) return false;

            try {
                setLoading(true);
                setError(null);

                const today = new Date().toISOString().split('T')[0];
                await MuscleRepository.saveMuscleRecovery({
                    userId,
                    muscleGroup,
                    date: today,
                    soreness,
                    recoveryStatus: status,
                });

                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to save recovery data';
                setError(message);
                console.error('Error saving recovery data:', err);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [userId]
    );

    const getRecoveryHistory = useCallback(
        async (muscleGroup: MuscleGroup, days: number = 7) => {
            if (!userId) return [];

            try {
                setLoading(true);
                const { format, subDays } = require('date-fns');
                const endDate = format(new Date(), 'yyyy-MM-dd');
                const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
                const db = await require('@/db/database').getDatabase();
                const result = await db.getAllAsync(
                    `SELECT * FROM muscle_recovery WHERE user_id = ? AND muscle_group = ? AND date >= ? ORDER BY date DESC`,
                    [userId, muscleGroup, startDate]
                );
                return result;
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load recovery history');
                console.error('Error loading recovery history:', err);
                return [];
            } finally {
                setLoading(false);
            }
        },
        [userId]
    );

    return {
        loading,
        error,
        saveRecoveryData,
        getRecoveryHistory,
    };
}

/**
 * Hook for accessing muscle analytics
 */
export function useMuscleAnalytics() {
    const { user } = useAuthStore();
    const userId = user?.id;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getVolumeByMuscle = useCallback(
        async (days: number = 7): Promise<Map<MuscleGroup, number>> => {
            if (!userId) return new Map();

            try {
                setLoading(true);
                const { format, subDays } = require('date-fns');
                const endDate = format(new Date(), 'yyyy-MM-dd');
                const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
                const stats = await MuscleRepository.getMuscleStatsForDateRange(userId, startDate, endDate);

                const volumeMap = new Map<MuscleGroup, number>();
                stats.forEach((stat: any) => {
                    const current = volumeMap.get(stat.muscleGroup) || 0;
                    volumeMap.set(stat.muscleGroup, current + stat.volume);
                });

                return volumeMap;
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load volume data');
                return new Map();
            } finally {
                setLoading(false);
            }
        },
        [userId]
    );

    const getMuscleFrequency = useCallback(
        async (days: number = 7): Promise<Map<MuscleGroup, number>> => {
            if (!userId) return new Map();

            try {
                setLoading(true);
                const { format, subDays } = require('date-fns');
                const endDate = format(new Date(), 'yyyy-MM-dd');
                const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
                const stats = await MuscleRepository.getMuscleStatsForDateRange(userId, startDate, endDate);

                const frequencyMap = new Map<MuscleGroup, Set<string>>();
                stats.forEach((stat: any) => {
                    const dates = frequencyMap.get(stat.muscleGroup) || new Set();
                    dates.add(stat.date);
                    frequencyMap.set(stat.muscleGroup, dates);
                });

                // Convert to count
                const result = new Map<MuscleGroup, number>();
                frequencyMap.forEach((dates, muscle) => {
                    result.set(muscle, dates.size);
                });

                return result;
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load frequency data');
                return new Map();
            } finally {
                setLoading(false);
            }
        },
        [userId]
    );

    return {
        loading,
        error,
        getVolumeByMuscle,
        getMuscleFrequency,
    };
}

export default useMuscleVisualization;
