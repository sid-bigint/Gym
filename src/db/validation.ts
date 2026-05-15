import { z } from 'zod';

// User Validation Schema
export const UserSchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name is too long"),
    gender: z.enum(['male', 'female']),
    age: z.number().int().min(10, "Must be at least 10 years old").max(100, "Invalid age"),

    // Stored in Metric (cm / kg)
    height: z.number().positive("Height must be positive").max(300, "Invalid height"),
    weight: z.number().positive("Weight must be positive").max(500, "Invalid weight"),

    activityLevel: z.string(), // We can be stricter with enum if we move types to shared location
    goal: z.string(),

    targetCalories: z.number().positive(),
    targetProtein: z.number().nonnegative(),
    targetCarbs: z.number().nonnegative(),
    targetFats: z.number().nonnegative(),

    picture: z.string().nullable().optional(),

    // Enhanced calculator fields
    bodyFatPercent: z.number().min(3).max(60).nullable().optional(),
    sleepHours: z.string().nullable().optional(),
    mealsPerDay: z.number().int().min(1).max(8).nullable().optional(),
    goalIntensity: z.string().nullable().optional(),
    workoutType: z.string().nullable().optional(),
    workoutDuration: z.number().int().min(10).max(180).nullable().optional(),
    workoutFrequency: z.number().int().min(1).max(7).nullable().optional(),
    
    // Gamification
    xp: z.number().int().nonnegative().optional(),
    level: z.number().int().positive().optional(),
    streakShields: z.number().int().nonnegative().optional(),
    lastShieldAwardDate: z.string().nullable().optional(),
    badges: z.string().nullable().optional(),
});

// Partial schema for updates
export const UpdateUserSchema = UserSchema.partial();

// Nutrition Log Schema
export const NutritionLogSchema = z.object({
    userId: z.number().or(z.string()).refine((val) => !!val, "User ID is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"), // ISO Date validation
    name: z.string().min(1, "Food name is required"),
    calories: z.number().nonnegative(),
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fats: z.number().nonnegative(),
    type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});
