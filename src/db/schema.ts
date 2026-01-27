import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// User Profile Table
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name'),
    gender: text('gender'), // 'male' | 'female'
    age: integer('age'),

    // We will standardize these to Metric (CM and KG) in the application layer
    // If the user inputs 5.9 (Feet), we convert to ~175.26 CM before storing.
    height: real('height'),
    weight: real('weight'),

    activityLevel: text('activity_level'), // 'sedentary', 'moderate', etc.
    goal: text('goal'), // 'lose_weight', 'gain_muscle', etc.

    targetCalories: integer('target_calories'),
    targetProtein: integer('target_protein'),
    targetCarbs: integer('target_carbs'),
    targetFats: integer('target_fats'),

    picture: text('picture'),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Nutrition Logs (What existing users eat)
export const nutritionLogs = sqliteTable('nutrition_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id'), // logically links to users.id
    date: text('date').notNull(), // ISO Date string YYYY-MM-DD
    name: text('name').notNull(), // Food name e.g., "Chicken Breast"
    calories: integer('calories'),
    protein: integer('protein'),
    carbs: integer('carbs'),
    fats: integer('fats'),
    type: text('type'), // 'breakfast', 'lunch', etc.
});

// Offline Sync Queue
export const pendingSyncs = sqliteTable('pending_syncs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    action: text('action'), // 'UPDATE_USER', 'ADD_WORKOUT'
    payload: text('payload'), // JSON string
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    status: text('status').default('PENDING'),
});

// =========================================================
// PHASE 1: WORKOUT SYSTEM SCHEMA
// =========================================================

// Exercises Library (Predefined + Custom)
export const exercises = sqliteTable('exercises', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    muscleGroup: text('muscle_group'), // e.g., 'Chest', 'Back', 'Legs'
    type: text('type'), // Matches JSON 'type' (e.g., 'Gym', 'Calisthenics') - formerly 'equipment'
    videoUrl: text('video_url'),
    instructions: text('instructions'), // JSON string of instructions
    images: text('images'), // JSON string of image URLs
    isCustom: integer('is_custom').default(0), // 0 = standard, 1 = custom
    userId: integer('user_id'), // Null for global exercises, set for custom ones
});

// Workout Sessions (A single performed workout)
export const workoutSessions = sqliteTable('workout_sessions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id),
    name: text('name'),
    date: text('date').notNull(),
    duration: integer('duration_seconds'),
    notes: text('notes'),
    status: text('status').default('COMPLETED'),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Workout Sets (The atomic unit of a workout)
export const workoutSets = sqliteTable('workout_sets_v2', { // Version 2 to avoid conflict with legacy table
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: integer('session_id').references(() => workoutSessions.id).notNull(),
    exerciseId: integer('exercise_id').references(() => exercises.id).notNull(),
    setNumber: integer('set_number').notNull(),
    weight: real('weight').notNull(),
    reps: integer('reps').notNull(),
    rpe: real('rpe'),
    timestamp: text('timestamp').default('CURRENT_TIMESTAMP'),
});
