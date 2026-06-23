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

    // --- MIGRATIONS ---

    // 1. Migration: Add program_id to routines if missing
    try {
      const tableInfo = await db.getAllAsync<any>("PRAGMA table_info(routines)");
      const hasProgramId = tableInfo.some(col => col.name === 'program_id');
      if (!hasProgramId) {
        console.log("Migrating routines table: Adding program_id column");
        await db.execAsync("ALTER TABLE routines ADD COLUMN program_id TEXT");
      }

      // Backfill Check
      for (const bundle of PREDEFINED_BUNDLES) {
        for (const rTemplate of bundle.routines) {
          await db.runAsync(
            'UPDATE routines SET program_id = ? WHERE name = ? AND program_id IS NULL',
            [bundle.id, rTemplate.name]
          );
        }
      }
    } catch (e) {
      console.warn("Routines migration failed:", e);
    }

    // 2. Migration: Add picture column to users if missing
    try {
      const userTableInfo = await db.getAllAsync<any>("PRAGMA table_info(users)");
      const hasPicture = userTableInfo.some(col => col.name === 'picture');
      if (!hasPicture && userTableInfo.length > 0) {
        console.log("Migrating users table: Adding picture column");
        await db.execAsync("ALTER TABLE users ADD COLUMN picture TEXT");
      }
    } catch (e) {
      console.warn("User migration failed:", e);
    }

    // 2b. Migration: Add enhanced calculator columns to users if missing
    try {
      const userTableInfo2 = await db.getAllAsync<any>("PRAGMA table_info(users)");
      const existingCols = new Set(userTableInfo2.map((col: any) => col.name));

      const newColumns = [
        { name: 'body_fat_percent', type: 'REAL' },
        { name: 'sleep_hours', type: 'TEXT' },
        { name: 'meals_per_day', type: 'INTEGER' },
        { name: 'goal_intensity', type: 'TEXT' },
        { name: 'workout_type', type: 'TEXT' },
        { name: 'workout_duration', type: 'INTEGER' },
        { name: 'workout_frequency', type: 'INTEGER' },
        { name: 'xp', type: 'INTEGER DEFAULT 0' },
        { name: 'level', type: 'INTEGER DEFAULT 1' },
        { name: 'streak_shields', type: 'INTEGER DEFAULT 0' },
        { name: 'last_shield_award_date', type: 'TEXT' },
        { name: 'badges', type: 'TEXT' },
      ];

      for (const col of newColumns) {
        if (!existingCols.has(col.name)) {
          console.log(`Migrating users table: Adding ${col.name} column`);
          await db.execAsync(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        }
      }
    } catch (e) {
      console.warn("Enhanced calculator/gamification migration failed:", e);
    }

    // 3. Migration: Add user_id to relevant tables if missing
    const tablesToCheck = [
      'routines',
      'workouts',
      'nutrition_logs',
      'progress_measurements'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const tInfo = await db.getAllAsync<any>(`PRAGMA table_info(${tableName})`);
        const hasUserId = tInfo.some(col => col.name === 'user_id');
        if (!hasUserId && tInfo.length > 0) {
          console.log(`Migrating ${tableName} table: Adding user_id column`);
          await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN user_id TEXT`);
        }
      } catch (e) {
        console.warn(`User ID migration failed for ${tableName}:`, e);
      }
    }

    // 4. Migration: Add folders and pinning support to routines
    try {
      const routinesInfo = await db.getAllAsync<any>("PRAGMA table_info(routines)");
      const existingCols = new Set(routinesInfo.map((col: any) => col.name));
      
      const newCols = [
        { name: 'folder_id', type: 'INTEGER' },
        { name: 'is_pinned', type: 'INTEGER DEFAULT 0' },
        { name: 'order_index', type: 'INTEGER DEFAULT 0' }
      ];

      for (const col of newCols) {
        if (!existingCols.has(col.name)) {
          console.log(`Migrating routines table: Adding ${col.name} column`);
          await db.execAsync(`ALTER TABLE routines ADD COLUMN ${col.name} ${col.type}`);
        }
      }
    } catch (e) {
      console.warn("Folder migration failed:", e);
    }

    // 4. Migration: Update exercises table for Phase 1
    try {
      const exTableInfo = await db.getAllAsync<any>("PRAGMA table_info(exercises)");
      if (exTableInfo.length > 0) {
        const hasVideoUrl = exTableInfo.some(col => col.name === 'video_url');
        const hasUserIdEx = exTableInfo.some(col => col.name === 'user_id');

        if (!hasVideoUrl) {
          console.log("Migrating exercises table: Adding video_url column");
          await db.execAsync("ALTER TABLE exercises ADD COLUMN video_url TEXT");
        }
        if (!hasUserIdEx) {
          console.log("Migrating exercises table: Adding user_id column");
          await db.execAsync("ALTER TABLE exercises ADD COLUMN user_id INTEGER");
        }
      }
    } catch (e) {
      console.warn("Exercises migration failed:", e);
    }

    // --- TABLE CREATION ---

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
                body_fat_percent REAL,
                sleep_hours TEXT,
                meals_per_day INTEGER,
                goal_intensity TEXT,
                workout_type TEXT,
                workout_duration INTEGER,
                workout_frequency INTEGER,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                streak_shields INTEGER DEFAULT 0,
                last_shield_award_date TEXT,
                badges TEXT,
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
                images TEXT,
                video_url TEXT,
                user_id INTEGER
            );

            -- Folders table
            CREATE TABLE IF NOT EXISTS folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                user_id TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- Routines table
            CREATE TABLE IF NOT EXISTS routines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                program_id TEXT,
                folder_id INTEGER,
                description TEXT,
                is_pinned INTEGER DEFAULT 0,
                order_index INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                user_id TEXT
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

            -- Workouts (Legacy)
            CREATE TABLE IF NOT EXISTS workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                routine_id INTEGER,
                routine_name TEXT,
                date TEXT NOT NULL,
                duration_minutes INTEGER,
                notes TEXT,
                user_id TEXT
            );

            -- Workout Sets (Legacy)
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

            -- PHASE 1: New Workout Tables
            CREATE TABLE IF NOT EXISTS workout_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                name TEXT,
                date TEXT NOT NULL,
                duration_seconds INTEGER,
                notes TEXT,
                status TEXT DEFAULT 'COMPLETED',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS workout_sets_v2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                set_number INTEGER NOT NULL,
                weight REAL NOT NULL,
                reps INTEGER NOT NULL,
                rpe REAL,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- Muscle visualization daily stats
            CREATE TABLE IF NOT EXISTS muscle_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                muscle_group TEXT NOT NULL,
                date TEXT NOT NULL,
                volume REAL DEFAULT 0,
                set_count INTEGER DEFAULT 0,
                rep_count INTEGER DEFAULT 0,
                intensity REAL DEFAULT 0,
                UNIQUE(user_id, muscle_group, date)
            );

            -- Muscle recovery status
            CREATE TABLE IF NOT EXISTS muscle_recovery (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                muscle_group TEXT NOT NULL,
                date TEXT NOT NULL,
                soreness INTEGER DEFAULT 0,
                recovery_status TEXT DEFAULT 'FRESH',
                last_trained_date TEXT,
                rest_days_since INTEGER DEFAULT 0,
                UNIQUE(user_id, muscle_group, date)
            );

            -- Meal Sessions (named groupings of nutrition logs)
            CREATE TABLE IF NOT EXISTS meal_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                name TEXT NOT NULL,
                meal_type TEXT NOT NULL DEFAULT 'snack',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
                type TEXT,
                user_id TEXT,
                meal_session_id INTEGER
            );

            -- Custom foods
            CREATE TABLE IF NOT EXISTS custom_foods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                name TEXT NOT NULL,
                category TEXT,
                calories INTEGER DEFAULT 0,
                protein INTEGER DEFAULT 0,
                carbs INTEGER DEFAULT 0,
                fats INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- Saved meals
            CREATE TABLE IF NOT EXISTS saved_meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                name TEXT NOT NULL,
                items_json TEXT NOT NULL,
                calories INTEGER DEFAULT 0,
                protein REAL DEFAULT 0,
                carbs REAL DEFAULT 0,
                fats REAL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS recent_foods (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id TEXT NOT NULL,
              name TEXT NOT NULL,
              calories REAL NOT NULL,
              protein REAL NOT NULL,
              carbs REAL NOT NULL,
              fats REAL NOT NULL,
              last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              frequency_count INTEGER DEFAULT 1,
              UNIQUE(user_id, name)
            );

            CREATE TABLE IF NOT EXISTS water_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id TEXT NOT NULL,
              date TEXT NOT NULL,
              glasses INTEGER DEFAULT 0,
              UNIQUE(user_id, date)
            );

            -- User settings
            CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                theme TEXT DEFAULT 'system',
                notifications_enabled BOOLEAN DEFAULT 1,
                sound_enabled BOOLEAN DEFAULT 1
            );

            -- Progress measurements
            CREATE TABLE IF NOT EXISTS progress_measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                weight REAL,
                body_fat_percentage REAL,
                date TEXT NOT NULL,
                user_id TEXT
            );

            -- Offline Sync Queue
            CREATE TABLE IF NOT EXISTS pending_syncs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT,
                payload TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'PENDING'
            );
        `);

    // --- MEAL SESSION MIGRATION ---
    try {
      const nlInfo = await db.getAllAsync<any>("PRAGMA table_info(nutrition_logs)");
      const hasSessionId = nlInfo.some((col: any) => col.name === 'meal_session_id');
      if (!hasSessionId && nlInfo.length > 0) {
        console.log("Migrating nutrition_logs: Adding meal_session_id column");
        await db.execAsync("ALTER TABLE nutrition_logs ADD COLUMN meal_session_id INTEGER");
      }
    } catch (e) {
      console.warn("meal_session_id migration failed:", e);
    }

    // --- UNIQUE INDEXES FOR RECOVERY & STATS ---
    try {
      // 1. Cleanup duplicates for muscle_stats (Keep latest ID)
      await db.execAsync(`
        DELETE FROM muscle_stats 
        WHERE id NOT IN (
          SELECT MAX(id) FROM muscle_stats GROUP BY user_id, muscle_group, date
        );
      `);

      // 2. Cleanup duplicates for muscle_recovery (Keep latest ID)
      await db.execAsync(`
        DELETE FROM muscle_recovery 
        WHERE id NOT IN (
          SELECT MAX(id) FROM muscle_recovery GROUP BY user_id, muscle_group, date
        );
      `);

      // 3. Apply Unique Indexes
      await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_muscle_stats_unique 
        ON muscle_stats (user_id, muscle_group, date);
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_muscle_recovery_unique 
        ON muscle_recovery (user_id, muscle_group, date);
      `);
    } catch (e) {
      console.warn("Muscle index migration failed:", e);
    }

    console.log('All tables created/verified successfully');

    // Seed exercises if table is empty
    try {
      const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
      if (result && result.count === 0) {
        console.log(`Seeding exercises...`);
        await db.withTransactionAsync(async () => {
          for (const ex of exerciseSource.exercises) {
            await db.runAsync(
              'INSERT INTO exercises (name, muscle_group, type, is_custom, instructions, images) VALUES (?, ?, ?, ?, ?, ?)',
              [ex.name || 'Unknown', ex.category || 'General', ex.type || 'General', 0, JSON.stringify(ex.instructions || []), JSON.stringify(ex.images || [])]
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
