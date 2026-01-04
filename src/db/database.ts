import * as SQLite from 'expo-sqlite';
import exerciseSource from '../data/exerciseData.json';

import { PREDEFINED_BUNDLES } from '../data/exploreBundles';

// V8: NPE Check and Strict Sanitization
export const DB_NAME = 'gym_app_v8.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    try {
      dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
      console.log('Database opened successfully');
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  }
  return dbInstance;
}

export async function initDatabase() {
  try {
    console.log('Starting database initialization (V8)...');
    const db = await getDatabase();

    // Disable foreign keys during setup to avoid constraint issues
    await db.execAsync('PRAGMA foreign_keys = OFF;');

    // Migration: Add program_id to routines if missing
    try {
      const tableInfo = await db.getAllAsync<any>("PRAGMA table_info(routines)");
      const hasProgramId = tableInfo.some(col => col.name === 'program_id');
      if (!hasProgramId) {
        console.log("Migrating routines table: Adding program_id column");
        await db.execAsync("ALTER TABLE routines ADD COLUMN program_id TEXT");
      }

      // Backfill Check (run always to catch legacy data)
      // Groups existing routines by name if they match a bundle
      console.log("Checking for routines to backfill program_id...");
      for (const bundle of PREDEFINED_BUNDLES) {
        for (const rTemplate of bundle.routines) {
          await db.runAsync(
            'UPDATE routines SET program_id = ? WHERE name = ? AND program_id IS NULL',
            [bundle.id, rTemplate.name]
          );
        }
      }
    } catch (e) {
      console.warn("Migration/Backfill failed:", e);
    }

    // Migration: Add picture column to users if missing
    try {
      const userTableInfo = await db.getAllAsync<any>("PRAGMA table_info(users)");
      const hasPicture = userTableInfo.some(col => col.name === 'picture');
      if (!hasPicture) {
        console.log("Migrating users table: Adding picture column");
        await db.execAsync("ALTER TABLE users ADD COLUMN picture TEXT");
      }
    } catch (e) {
      console.warn("User migration failed:", e);
    }

    // ... (rest of function)

    console.log('Database initialization (V7) completed successfully');

    // Create all tables
    await db.execAsync(`
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                gender TEXT,
                age INTEGER,
                height REAL,
                weight REAL,
                activity_level TEXT,
                goal TEXT,
                target_calories INTEGER,
                target_protein INTEGER,
                target_carbs INTEGER,
                target_fats INTEGER,
                picture TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- Exercises table
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                muscle_group TEXT,
                type TEXT,
                is_custom BOOLEAN DEFAULT 0,
                instructions TEXT,
                images TEXT
            );

            -- Routines table
            CREATE TABLE IF NOT EXISTS routines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                program_id TEXT,
                description TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- Routine exercises junction table
            CREATE TABLE IF NOT EXISTS routine_exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                routine_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                sets INTEGER DEFAULT 3,
                reps INTEGER DEFAULT 10,
                rest_seconds INTEGER DEFAULT 60,
                order_index INTEGER
            );

            -- Workouts (completed workout sessions)
            CREATE TABLE IF NOT EXISTS workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                routine_id INTEGER,
                routine_name TEXT,
                date TEXT NOT NULL,
                duration_minutes INTEGER,
                notes TEXT
            );

            -- Workout sets (individual sets within a workout)
            CREATE TABLE IF NOT EXISTS workout_sets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workout_id INTEGER NOT NULL,
                exercise_id INTEGER,
                exercise_name TEXT,
                set_number INTEGER,
                weight REAL,
                reps INTEGER,
                rest_seconds INTEGER,
                completed BOOLEAN DEFAULT 0,
                type TEXT DEFAULT 'Normal'
            );

            -- Nutrition logs
            CREATE TABLE IF NOT EXISTS nutrition_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                name TEXT NOT NULL,
                calories INTEGER,
                protein INTEGER,
                carbs INTEGER,
                fats INTEGER,
                type TEXT
            );

            -- Custom foods (user-defined foods)
            CREATE TABLE IF NOT EXISTS custom_foods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                category TEXT,
                calories INTEGER DEFAULT 0,
                protein INTEGER DEFAULT 0,
                carbs INTEGER DEFAULT 0,
                fats INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- User settings
            CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                theme TEXT DEFAULT 'system',
                notifications_enabled BOOLEAN DEFAULT 1,
                sound_enabled BOOLEAN DEFAULT 1
            );

            -- Progress measurements (weight tracking)
            CREATE TABLE IF NOT EXISTS progress_measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                weight REAL,
                body_fat_percentage REAL,
                date TEXT NOT NULL
            );
        `);

    console.log('All tables created successfully');

    // Seed exercises if table is empty
    try {
      const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
      console.log('Current exercise count:', result?.count);

      if (result && result.count === 0) {
        console.log(`Seeding ${exerciseSource.exercises.length} exercises...`);

        await db.withTransactionAsync(async () => {
          for (const ex of exerciseSource.exercises) {
            const safeName = ex.name || 'Unknown Exercise';
            const safeCategory = ex.category || 'General';
            const safeType = ex.type || 'General';
            const safeInst = ex.instructions ? JSON.stringify(ex.instructions) : '[]';
            const safeImgs = ex.images ? JSON.stringify(ex.images) : '[]';

            await db.runAsync(
              'INSERT INTO exercises (name, muscle_group, type, is_custom, instructions, images) VALUES (?, ?, ?, ?, ?, ?)',
              [safeName, safeCategory, safeType, 0, safeInst, safeImgs]
            );
          }
        });

        console.log('Exercises seeded successfully');
      }
    } catch (seedError) {
      console.error('Error seeding exercises:', seedError);
    }

    // Re-enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    console.log('Database initialization (V8) completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
