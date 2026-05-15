import { useUserStore } from '../store/useUserStore';

export const GamificationService = {
    // XP Constants
    XP_MEAL_LOG: 10,
    XP_WORKOUT_COMPLETE: 25,
    XP_PERFECT_DAY: 50,
    XP_CHALLENGE_COMPLETE: 50,

    async awardXP(amount: number) {
        const userStore = useUserStore.getState();
        const user = userStore.user;
        if (!user) return;

        const currentXp = user.xp || 0;
        let newXp = currentXp + amount;
        
        const currentLevel = user.level || 1;
        const xpForNextLevel = currentLevel * 100; // Simple curve: 100, 200, 300...

        let newLevel = currentLevel;
        if (newXp >= xpForNextLevel) {
            newLevel += 1;
            newXp -= xpForNextLevel; // Carry over
            console.log(`Level Up! Welcome to Level ${newLevel}`);
            
            // Level badges
            if (newLevel === 5) await this.awardBadge('level_5');
            if (newLevel === 10) await this.awardBadge('level_10');
            if (newLevel === 25) await this.awardBadge('level_25');
            if (newLevel === 50) await this.awardBadge('level_50');

            const { useAlertStore } = require('../store/useAlertStore');
            useAlertStore.getState().showAlert('Level Up! 🌟', `You are now Level ${newLevel}! Keep pushing.`);
        }

        await userStore.updateProfile({ xp: newXp, level: newLevel });
    },

    async consumeStreakShield(dateToShield: string): Promise<boolean> {
        const userStore = useUserStore.getState();
        const user = userStore.user;
        if (!user || (user.streakShields || 0) <= 0) return false;

        const newShields = (user.streakShields || 1) - 1;
        await userStore.updateProfile({ streakShields: newShields });
        console.log("🛡️ Streak Shield Consumed for date:", dateToShield);
        
        // Insert a dummy session so it doesn't try to consume again tomorrow
        try {
            const { getDatabase } = require('../db/database');
            const db = await getDatabase();
            await db.runAsync(
                `INSERT INTO workout_sessions (user_id, name, date, duration_seconds, notes, status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [user.id, '🛡️ Streak Saved', dateToShield, 0, '', 'COMPLETED']
            );
        } catch (e) {
            console.error("Failed to insert shield session", e);
        }
        
        await this.awardBadge('shield_saver');
        return true;
    },

    async checkStreakShields(currentStreakDays: number) {
        const userStore = useUserStore.getState();
        const user = userStore.user;
        if (!user) return;

        // Award 1 shield for every 7 days of continuous streak, max 3 shields
        if (currentStreakDays > 0 && currentStreakDays % 7 === 0) {
            const currentShields = user.streakShields || 0;
            const todayStr = new Date().toISOString().split('T')[0];
            
            // Only award one shield per day to prevent duplicate awards on re-renders
            if (user.lastShieldAwardDate !== todayStr && currentShields < 3) {
                await userStore.updateProfile({ 
                    streakShields: currentShields + 1,
                    lastShieldAwardDate: todayStr
                });
                console.log("Earned a Streak Shield! 🛡️");
                await this.awardBadge('shield_hero');
            }
        }
        
        // Check Streak Badges
        if (currentStreakDays >= 3) await this.awardBadge('streak_3');
        if (currentStreakDays >= 7) await this.awardBadge('streak_7');
        if (currentStreakDays >= 30) await this.awardBadge('streak_30');
    },

    async awardBadge(badgeId: string) {
        const userStore = useUserStore.getState();
        const user = userStore.user;
        if (!user) return;

        const currentBadges = user.badges || [];
        if (!currentBadges.includes(badgeId)) {
            const newBadges = [...currentBadges, badgeId];
            await userStore.updateProfile({ badges: newBadges });
            console.log(`Earned Badge: ${badgeId} 🏅`);
            
            // In a real app, trigger a global toast or modal here
            const { useAlertStore } = require('../store/useAlertStore');
            const { BADGES } = require('../constants/badges');
            const badgeInfo = BADGES.find((b: any) => b.id === badgeId);
            if (badgeInfo) {
                useAlertStore.getState().showAlert('Badge Unlocked! 🏅', `${badgeInfo.name}: ${badgeInfo.description}`);
            }
        }
    },
    
    async evaluateWorkoutBadges(workout: any, totalWorkouts: number) {
        await this.awardXP(this.XP_WORKOUT_COMPLETE);
        
        if (totalWorkouts === 1) await this.awardBadge('first_workout');
        if (totalWorkouts === 100) await this.awardBadge('century_club_workouts');
        
        if (workout.volume > 10000) await this.awardBadge('heavy_lifter');
        if (workout.duration > 90) await this.awardBadge('marathoner');
        
        const hour = new Date().getHours();
        if (hour >= 22 || hour < 4) await this.awardBadge('night_owl');
        if (hour >= 4 && hour < 7) await this.awardBadge('early_bird');
    }
};
