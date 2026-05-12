import { getDatabase } from '@/db/database';
import { MuscleData, MuscleGroup } from '@/store/useMuscleStore';
import { format, subDays, differenceInDays } from 'date-fns';

export interface MuscleStatsInput {
    userId: string;
    muscleGroup: MuscleGroup;
    date: string;
    volume: number;
    setCount: number;
    repCount: number;
    intensity: number;
}

export interface MuscleRecoveryInput {
    userId: string;
    muscleGroup: MuscleGroup;
    date: string;
    soreness: number;
    recoveryStatus: 'FRESH' | 'FATIGUED' | 'SORE' | 'RECOVERING';
    lastTrainedDate?: string;
    restDaysSince?: number;
}

export class MuscleRepository {
    static async saveMuscleStats(stats: MuscleStatsInput): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT INTO muscle_stats (user_id, muscle_group, date, volume, set_count, rep_count, intensity)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [stats.userId, stats.muscleGroup, stats.date, stats.volume, stats.setCount, stats.repCount, stats.intensity]
        );
    }

    static async saveMuscleStatsBatch(statsList: MuscleStatsInput[]): Promise<void> {
        const db = await getDatabase();
        for (const stats of statsList) {
            await db.runAsync(
                `INSERT INTO muscle_stats (user_id, muscle_group, date, volume, set_count, rep_count, intensity)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(user_id, muscle_group, date) DO UPDATE SET
                    volume = volume + excluded.volume,
                    set_count = set_count + excluded.set_count,
                    rep_count = rep_count + excluded.rep_count,
                    intensity = MAX(intensity, excluded.intensity)`,
                [stats.userId, stats.muscleGroup, stats.date, stats.volume, stats.setCount, stats.repCount, stats.intensity]
            );
        }
    }

    static async getMuscleStatsForDate(userId: string, date: string): Promise<MuscleStatsInput[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<any>(
            `SELECT * FROM muscle_stats WHERE user_id = ? AND date = ?`,
            [userId, date]
        );
        return result.map(row => ({
            userId: row.user_id,
            muscleGroup: row.muscle_group as MuscleGroup,
            date: row.date,
            volume: row.volume || 0,
            setCount: row.set_count || 0,
            repCount: row.rep_count || 0,
            intensity: row.intensity || 0,
        }));
    }

    static async saveMuscleRecovery(recovery: MuscleRecoveryInput): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT OR REPLACE INTO muscle_recovery (user_id, muscle_group, date, soreness, recovery_status, last_trained_date, rest_days_since)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                recovery.userId, recovery.muscleGroup, recovery.date,
                recovery.soreness, recovery.recoveryStatus,
                recovery.lastTrainedDate || null, recovery.restDaysSince || 0,
            ]
        );
    }

    static async getLatestRecoveryData(userId: string): Promise<Map<MuscleGroup, MuscleRecoveryInput>> {
        const db = await getDatabase();
        const startDate = format(subDays(new Date(), 14), 'yyyy-MM-dd');
        
        const result = await db.getAllAsync<any>(
            `SELECT mr1.* 
             FROM muscle_recovery mr1
             INNER JOIN (
                SELECT muscle_group, MAX(date) as max_date
                FROM muscle_recovery
                WHERE user_id = ? AND date >= ?
                GROUP BY muscle_group
             ) mr2 ON mr1.muscle_group = mr2.muscle_group AND mr1.date = mr2.max_date
             WHERE mr1.user_id = ?`,
            [userId, startDate, userId]
        );

        const recoveryMap = new Map<MuscleGroup, MuscleRecoveryInput>();
        result.forEach(row => {
            recoveryMap.set(row.muscle_group as MuscleGroup, {
                userId: row.user_id,
                muscleGroup: row.muscle_group as MuscleGroup,
                date: row.date,
                soreness: row.soreness || 0,
                recoveryStatus: row.recovery_status as any,
                lastTrainedDate: row.last_trained_date || undefined,
                restDaysSince: row.rest_days_since || 0,
            });
        });
        return recoveryMap;
    }

    /**
     * Internal utility to derive Anatomical Intelligence Score (1-10)
     */
    private static deriveIntelligenceScore(currentVolume: number, history: number[]): number {
        if (history.length === 0) return 9; // First session in weeks? High intensity (Novelty)

        const maxPrev = Math.max(...history);
        const avgPrev = history.reduce((a, b) => a + b, 0) / history.length;

        // 1. New PR (Progressive Overload) -> Purple (9-10)
        if (currentVolume > maxPrev * 1.02) return 10;

        // 2. Stagnation check (Same volume for 3+ sessions) -> Green (1-3)
        if (history.length >= 3) {
            const isStagnant = history.slice(0, 3).every(v => Math.abs(v - history[0]) < v * 0.03);
            if (isStagnant && Math.abs(currentVolume - history[0]) < currentVolume * 0.03) {
                return 2; // Plateaus show as Green (Maintenance/Stall)
            }
        }

        // 3. No improvement check (2-3 sessions not hitting PR but matching avg) -> Medium/Blue (4-6)
        if (currentVolume >= avgPrev * 0.9) return 5;

        // Default based on volume density
        return Math.min(10, Math.max(1, currentVolume / 50));
    }

    static async getTodaysMuscleStats(userId: string): Promise<Map<MuscleGroup, MuscleData>> {
        const today = format(new Date(), 'yyyy-MM-dd');
        const stats = await this.getMuscleStatsForDate(userId, today);
        const recovery = await this.getLatestRecoveryData(userId);

        // Fetch last 20 days history for progress calculation
        const db = await getDatabase();
        const historyRows = await db.getAllAsync<any>(
            `SELECT muscle_group, volume FROM muscle_stats 
             WHERE user_id = ? AND date < ? AND date >= ?
             ORDER BY date DESC`,
            [userId, today, format(subDays(new Date(), 20), 'yyyy-MM-dd')]
        );
        const historyMap = new Map<string, number[]>();
        historyRows.forEach(row => {
            if (!historyMap.has(row.muscle_group)) historyMap.set(row.muscle_group, []);
            historyMap.get(row.muscle_group)!.push(row.volume);
        });

        const useMuscleStore = require('../store/useMuscleStore').default;
        const { getMuscleColor } = useMuscleStore.getState();
        const muscleMap = new Map<MuscleGroup, MuscleData>();

        // Step 1: Initialize with all muscles from recovery data
        recovery.forEach((rec, group) => {
            const intensity = 0; 
            const soreness = rec.soreness || 0;
            const restDays = rec.date ? differenceInDays(new Date(), new Date(rec.date)) : 0;

            muscleMap.set(group, {
                group: group,
                volume: 0,
                setCount: 0,
                repCount: 0,
                intensity: 0,
                soreness: soreness,
                recoveryStatus: rec.recoveryStatus || 'FRESH',
                lastTrainedDate: rec.date || null,
                restDaysSince: restDays,
                color: getMuscleColor(group, intensity, soreness),
            });
        });

        // Step 2: Overlay today's workout stats with Anatomical Intelligence
        stats.forEach(stat => {
            const existing = muscleMap.get(stat.muscleGroup);
            const totalVolume = (existing?.volume || 0) + stat.volume;
            const totalSets = (existing?.setCount || 0) + stat.setCount;
            const totalReps = (existing?.repCount || 0) + stat.repCount;
            
            const muscleHistory = historyMap.get(stat.muscleGroup) || [];
            const intensity = this.deriveIntelligenceScore(totalVolume, muscleHistory);
            
            const soreness = existing?.soreness || 0;
            const recStatus = existing?.recoveryStatus || 'FRESH';

            muscleMap.set(stat.muscleGroup, {
                group: stat.muscleGroup,
                volume: totalVolume,
                setCount: totalSets,
                repCount: totalReps,
                intensity,
                soreness,
                recoveryStatus: recStatus,
                lastTrainedDate: today,
                restDaysSince: 0,
                color: getMuscleColor(stat.muscleGroup, intensity, soreness),
            });
        });

        return muscleMap;
    }

    static async getWeeklyMuscleStats(userId: string): Promise<Map<MuscleGroup, number[]>> {
        const { startOfWeek, endOfWeek, getDay } = require('date-fns');
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        
        const stats = await this.getMuscleStatsForDateRange(userId, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
        const weeklyMap = new Map<MuscleGroup, number[]>();

        stats.forEach(stat => {
            if (!weeklyMap.has(stat.muscleGroup)) {
                weeklyMap.set(stat.muscleGroup, Array(7).fill(0));
            }
            const date = new Date(stat.date + 'T00:00:00');
            let dayIndex = getDay(date) - 1;
            if (dayIndex < 0) dayIndex = 6;
            
            if (dayIndex >= 0 && dayIndex < 7) {
                const volumes = weeklyMap.get(stat.muscleGroup)!;
                volumes[dayIndex] = (volumes[dayIndex] || 0) + stat.volume;
            }
        });

        return weeklyMap;
    }

    static async getMuscleStatsForDateRange(userId: string, startDate: string, endDate: string): Promise<MuscleStatsInput[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<any>(
            `SELECT * FROM muscle_stats WHERE user_id = ? AND date >= ? AND date <= ?`,
            [userId, startDate, endDate]
        );
        return result.map(row => ({
            userId: row.user_id,
            muscleGroup: row.muscle_group as MuscleGroup,
            date: row.date,
            volume: row.volume || 0,
            setCount: row.set_count || 0,
            repCount: row.rep_count || 0,
            intensity: row.intensity || 0,
        }));
    }

    static async clearOldStats(userId: string, retentionDays: number = 90): Promise<void> {
        const db = await getDatabase();
        const thresholdDate = format(subDays(new Date(), retentionDays), 'yyyy-MM-dd');
        await db.runAsync(`DELETE FROM muscle_stats WHERE user_id = ? AND date < ?`, [userId, thresholdDate]);
        await db.runAsync(`DELETE FROM muscle_recovery WHERE user_id = ? AND date < ?`, [userId, thresholdDate]);
    }
}

export default MuscleRepository;
