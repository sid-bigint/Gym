import { child, get, ref, set } from 'firebase/database';
import { auth, rtdb } from '../config/firebase';
import { getDatabase } from '../db/database';

type TableSnapshot = Record<string, any[]>;

const SYNC_TABLES = [
    'users',
    'routines',
    'routine_exercises',
    'workout_sessions',
    'workout_sets_v2',
    'nutrition_logs',
    'custom_foods',
    'saved_meals',
    'progress_measurements',
] as const;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

function canSync() {
    const user = auth.currentUser;
    return !!user && !user.isAnonymous;
}

async function getLocalDataCounts() {
    const db = await getDatabase();
    const counts = await Promise.all([
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM routines WHERE user_id IS NOT NULL'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM workout_sessions WHERE user_id IS NOT NULL'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM nutrition_logs WHERE user_id IS NOT NULL'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM custom_foods'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM saved_meals'),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM progress_measurements WHERE user_id IS NOT NULL'),
    ]);

    return counts.reduce((acc, row) => acc + Number(row?.count || 0), 0);
}

async function exportLocalSnapshot(): Promise<TableSnapshot> {
    const db = await getDatabase();
    const snapshot: TableSnapshot = {};

    for (const table of SYNC_TABLES) {
        snapshot[table] = await db.getAllAsync<any>(`SELECT * FROM ${table}`);
    }

    snapshot.exercises = await db.getAllAsync<any>('SELECT * FROM exercises WHERE is_custom = 1');
    return snapshot;
}

async function clearUserScopedLocalData() {
    const db = await getDatabase();
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    try {
        await db.runAsync('DELETE FROM routine_exercises');
        await db.runAsync('DELETE FROM routines WHERE user_id IS NOT NULL');
        await db.runAsync('DELETE FROM workout_sets_v2');
        await db.runAsync('DELETE FROM workout_sessions WHERE user_id IS NOT NULL');
        await db.runAsync('DELETE FROM nutrition_logs WHERE user_id IS NOT NULL');
        await db.runAsync('DELETE FROM custom_foods');
        await db.runAsync('DELETE FROM saved_meals');
        await db.runAsync('DELETE FROM progress_measurements WHERE user_id IS NOT NULL');
        await db.runAsync('DELETE FROM exercises WHERE is_custom = 1');
        await db.runAsync('DELETE FROM users');
    } finally {
        await db.execAsync('PRAGMA foreign_keys = ON;');
    }
}

async function insertRows(table: string, rows: any[]) {
    if (!rows || rows.length === 0) return;
    const db = await getDatabase();

    for (const row of rows) {
        const entries = Object.entries(row).filter(([, value]) => value !== undefined);
        if (entries.length === 0) continue;
        const columns = entries.map(([key]) => key);
        const placeholders = columns.map(() => '?').join(', ');
        const values = entries.map(([, value]) => value) as any[];

        await db.runAsync(
            `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
        );
    }
}

async function importSnapshot(snapshot: TableSnapshot) {
    await clearUserScopedLocalData();
    const db = await getDatabase();

    await db.execAsync('PRAGMA foreign_keys = OFF;');
    try {
        await insertRows('users', snapshot.users || []);
        await insertRows('exercises', snapshot.exercises || []);
        await insertRows('routines', snapshot.routines || []);
        await insertRows('routine_exercises', snapshot.routine_exercises || []);
        await insertRows('workout_sessions', snapshot.workout_sessions || []);
        await insertRows('workout_sets_v2', snapshot.workout_sets_v2 || []);
        await insertRows('nutrition_logs', snapshot.nutrition_logs || []);
        await insertRows('custom_foods', snapshot.custom_foods || []);
        await insertRows('saved_meals', snapshot.saved_meals || []);
        await insertRows('progress_measurements', snapshot.progress_measurements || []);
    } finally {
        await db.execAsync('PRAGMA foreign_keys = ON;');
    }
}

export const CloudSyncService = {
    async backupNow(reason = 'manual') {
        if (!canSync() || isSyncing) return;

        const user = auth.currentUser;
        if (!user) return;

        isSyncing = true;
        try {
            const data = await exportLocalSnapshot();
            await set(ref(rtdb, `users/${user.uid}/backup`), {
                version: 1,
                reason,
                updatedAt: new Date().toISOString(),
                data,
            });
            console.log(`Cloud backup completed: ${reason}`);
        } catch (error) {
            console.error('Cloud backup failed:', error);
        } finally {
            isSyncing = false;
        }
    },

    scheduleBackup(reason = 'local-change') {
        if (!canSync()) return;

        if (syncTimer) {
            clearTimeout(syncTimer);
        }

        syncTimer = setTimeout(() => {
            syncTimer = null;
            CloudSyncService.backupNow(reason);
        }, 1200);
    },

    async restoreFromCloudIfLocalEmpty() {
        if (!canSync()) return false;

        const user = auth.currentUser;
        if (!user) return false;

        try {
            const localCount = await getLocalDataCounts();
            if (localCount > 0) return false;

            const snapshot = await get(child(ref(rtdb), `users/${user.uid}/backup`));
            if (!snapshot.exists()) return false;

            const payload = snapshot.val();
            if (!payload?.data) return false;

            await importSnapshot(payload.data);
            console.log('Cloud backup restored to local database');
            return true;
        } catch (error) {
            console.error('Cloud restore failed:', error);
            return false;
        }
    },
};
