import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, getDay } from 'date-fns';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useUserStore } from '../store/useUserStore';

export interface Insight {
    id: string;
    type: 'performance' | 'habit' | 'nutrition' | 'celebration';
    title: string;
    message: string;
    actionable_advice?: string;
    date_generated: string;
}

export const InsightEngine = {
    async generateWeeklyInsights(): Promise<Insight[]> {
        const insights: Insight[] = [];
        const user = useUserStore.getState().user;
        
        // We will generate this using the last 14 days of workout history to compare "This Week" vs "Last Week"
        const now = new Date();
        const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
        const lastWeekStart = subDays(thisWeekStart, 7);
        const lastWeekEnd = subDays(thisWeekStart, 1);

        // Access SQLite directly for full data if needed, but for now we'll use useWorkoutStore's getWorkoutHistory
        // Since getWorkoutHistory is limited, we might need to do a DB query to get all sessions in the last 14 days.
        const { getDatabase } = require('../db/database');
        const db = await getDatabase();

        try {
            const sessions = await useWorkoutStore.getState().getWorkoutHistory(30);

            // Filter for this week and last week
            const thisWeekSessions = sessions.filter(s => new Date(s.date) >= thisWeekStart);
            const lastWeekSessions = sessions.filter(s => new Date(s.date) >= lastWeekStart && new Date(s.date) <= lastWeekEnd);

            // --- 1. Consistency Insight ---
            if (thisWeekSessions.length > lastWeekSessions.length && lastWeekSessions.length > 0) {
                insights.push({
                    id: `consistency_${now.getTime()}`,
                    type: 'habit',
                    title: 'Consistency Level Up',
                    message: `You've worked out ${thisWeekSessions.length} times this week, beating last week's record!`,
                    actionable_advice: 'Keep this rhythm. Consistency is the primary driver of results.',
                    date_generated: now.toISOString()
                });
            } else if (thisWeekSessions.length === 0 && lastWeekSessions.length > 0) {
                insights.push({
                    id: `consistency_${now.getTime()}`,
                    type: 'habit',
                    title: 'Ready to Return?',
                    message: `You crushed it last week with ${lastWeekSessions.length} sessions, but haven't started this week yet.`,
                    actionable_advice: 'Even a 15-minute quick session today will reignite your momentum.',
                    date_generated: now.toISOString()
                });
            }

            // --- 2. Volume Progression Insight ---
            const thisWeekVolume = thisWeekSessions.reduce((sum, s) => sum + (s.volume || 0), 0);
            const lastWeekVolume = lastWeekSessions.reduce((sum, s) => sum + (s.volume || 0), 0);

            if (thisWeekVolume > lastWeekVolume && lastWeekVolume > 0) {
                const increasePercent = Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100);
                if (increasePercent >= 5) {
                    insights.push({
                        id: `volume_${now.getTime()}`,
                        type: 'performance',
                        title: 'Progressive Overload Detected',
                        message: `Your total lifting volume this week is up ${increasePercent}% compared to last week!`,
                        actionable_advice: 'Your muscles are adapting. Keep pushing the weights up slowly.',
                        date_generated: now.toISOString()
                    });
                }
            }

            // --- 3. Best Performance Day Insight ---
            if (sessions.length >= 5) {
                const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
                const dayVolumes = [0, 0, 0, 0, 0, 0, 0];
                
                sessions.forEach(s => {
                    const d = getDay(new Date(s.date));
                    dayCounts[d]++;
                    dayVolumes[d] += (s.volume || 0);
                });

                let bestDay = 0;
                let maxAvgVolume = 0;
                
                for(let i=0; i<7; i++) {
                    if (dayCounts[i] > 0) {
                        const avg = dayVolumes[i] / dayCounts[i];
                        if (avg > maxAvgVolume) {
                            maxAvgVolume = avg;
                            bestDay = i;
                        }
                    }
                }

                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                
                if (dayCounts[bestDay] >= 2) {
                    insights.push({
                        id: `best_day_${now.getTime()}`,
                        type: 'performance',
                        title: 'AI Pattern Analysis',
                        message: `Based on your history, you naturally perform best on ${dayNames[bestDay]}s, lifting higher average volume.`,
                        actionable_advice: `Try scheduling your heaviest compound lifts on ${dayNames[bestDay]}s.`,
                        date_generated: now.toISOString()
                    });
                }
            }
            
            // --- 4. Gamification / Celebration ---
            const streak = useWorkoutStore.getState().streak;
            if (streak.current > 0 && streak.current % 5 === 0) {
                 insights.push({
                    id: `streak_${now.getTime()}`,
                    type: 'celebration',
                    title: 'Unbreakable',
                    message: `You're on a ${streak.current}-day streak. That places you in the top tier of dedicated athletes.`,
                    actionable_advice: 'Rest days count. Make sure to hydrate and stretch to protect the streak.',
                    date_generated: now.toISOString()
                });
            }

        } catch (e) {
            console.error("Failed to generate AI insights", e);
        }

        // Return max 2 most relevant insights to not overwhelm the user
        return insights.slice(0, 2);
    }
};
