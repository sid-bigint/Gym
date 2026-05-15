export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Ionicons name
    color: string;
    category: 'workout' | 'streak' | 'nutrition' | 'milestone';
}

export const BADGES: Badge[] = [
    // --- WORKOUT BADGES ---
    { id: 'first_workout', name: 'First Blood', description: 'Complete your first workout session.', icon: 'barbell', color: '#3B82F6', category: 'workout' },
    { id: 'heavy_lifter', name: 'Heavy Lifter', description: 'Log a workout with over 10,000kg of total volume.', icon: 'fitness', color: '#8B5CF6', category: 'workout' },
    { id: 'night_owl', name: 'Night Owl', description: 'Complete a workout between 10 PM and 4 AM.', icon: 'moon', color: '#6366F1', category: 'workout' },
    { id: 'early_bird', name: 'Early Bird', description: 'Complete a workout before 7 AM.', icon: 'sunny', color: '#F59E0B', category: 'workout' },
    { id: 'marathoner', name: 'Marathoner', description: 'Complete a workout lasting over 90 minutes.', icon: 'timer', color: '#EF4444', category: 'workout' },
    { id: 'century_club_workouts', name: 'Century Club', description: 'Complete 100 workouts.', icon: 'trophy', color: '#F59E0B', category: 'workout' },

    // --- STREAK BADGES ---
    { id: 'streak_3', name: 'Gaining Momentum', description: 'Achieve a 3-day workout streak.', icon: 'flame', color: '#F97316', category: 'streak' },
    { id: 'streak_7', name: 'On Fire', description: 'Achieve a 7-day workout streak.', icon: 'flame', color: '#EF4444', category: 'streak' },
    { id: 'streak_30', name: 'Unstoppable', description: 'Achieve a 30-day workout streak.', icon: 'bonfire', color: '#EC4899', category: 'streak' },
    { id: 'shield_hero', name: 'Shield Hero', description: 'Earn your first Streak Shield.', icon: 'shield-checkmark', color: '#3B82F6', category: 'streak' },
    { id: 'shield_saver', name: 'Close Call', description: 'Use a Streak Shield to save your streak.', icon: 'shield-half', color: '#10B981', category: 'streak' },

    // --- NUTRITION BADGES ---
    { id: 'first_meal', name: 'Fuel Up', description: 'Log your first meal.', icon: 'restaurant', color: '#10B981', category: 'nutrition' },
    { id: 'macro_master', name: 'Macro Master', description: 'Hit your calorie goal within 50kcal.', icon: 'pie-chart', color: '#8B5CF6', category: 'nutrition' },
    { id: 'protein_king', name: 'Protein King', description: 'Hit your protein target for the day.', icon: 'nutrition', color: '#F43F5E', category: 'nutrition' },
    { id: 'hydration', name: 'Hydrated', description: 'Log 3 liters of water in a day.', icon: 'water', color: '#0EA5E9', category: 'nutrition' },

    // --- MILESTONE BADGES ---
    { id: 'level_5', name: 'Rising Star', description: 'Reach Level 5.', icon: 'star', color: '#FDE047', category: 'milestone' },
    { id: 'level_10', name: 'Veteran', description: 'Reach Level 10.', icon: 'medal', color: '#EAB308', category: 'milestone' },
    { id: 'level_25', name: 'Elite Athlete', description: 'Reach Level 25.', icon: 'diamond', color: '#38BDF8', category: 'milestone' },
    { id: 'level_50', name: 'Legend', description: 'Reach Level 50.', icon: 'flash', color: '#F43F5E', category: 'milestone' },
    { id: 'profile_complete', name: 'Committed', description: 'Complete your profile fully.', icon: 'person-circle', color: '#10B981', category: 'milestone' },
];
