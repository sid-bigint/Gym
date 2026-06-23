import { getDatabase } from '../db/database';
import type { WorkoutLog } from '../types';

export interface SaveSetParams {
    exerciseId: number;
    exerciseName?: string;
    weight: number;
    reps: number;
    rpe?: number | null;
}

export interface SaveSessionParams {
    name: string;
    durationSeconds: number;
    notes: string;
    date: string;
    userId: number | null;
    sets: SaveSetParams[];
}

export class WorkoutSessionRepository {
    static async saveSession(params: SaveSessionParams): Promise<number> {
        const db = await getDatabase();
        let sessionId = 0;
        await db.execAsync('PRAGMA foreign_keys = OFF;');
        try {
            const result = await db.runAsync(
                'INSERT INTO workout_sessions (name, duration_seconds, notes, date, user_id, status) VALUES (?, ?, ?, ?, ?, ?)',
                [params.name, params.durationSeconds, params.notes, params.date, params.userId, 'COMPLETED']
            );
            sessionId = result.lastInsertRowId;

            for (let i = 0; i < params.sets.length; i++) {
                const s = params.sets[i];
                const exerciseId = Number(s.exerciseId);
                if (!exerciseId || isNaN(exerciseId) || exerciseId <= 0) continue;
                await db.runAsync(
                    'INSERT INTO workout_sets_v2 (session_id, exercise_id, set_number, weight, reps, rpe) VALUES (?, ?, ?, ?, ?, ?)',
                    [sessionId, exerciseId, i + 1, s.weight, s.reps, s.rpe ?? null]
                );
            }
        } finally {
            await db.execAsync('PRAGMA foreign_keys = ON;');
        }
        return sessionId;
    }

    static async deleteSession(id: number): Promise<void> {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM workout_sets_v2 WHERE session_id = ?', [id]);
        await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [id]);
    }

    static async getHistoryPage(userId: number, limit: number, offset: number): Promise<any[]> {
        const db = await getDatabase();
        const sessions = await db.getAllAsync<any>(
            'SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?',
            [userId, limit, offset]
        );

        const enrichedLogs: any[] = [];
        for (const session of sessions) {
            const sets = await db.getAllAsync<any>(
                `SELECT ws.*, e.name as exercise_name
                 FROM workout_sets_v2 ws
                 LEFT JOIN exercises e ON ws.exercise_id = e.id
                 WHERE ws.session_id = ?`,
                [session.id]
            );

            const volume = sets.reduce((acc: number, s: any) => acc + (Number(s.weight || 0) * Number(s.reps || 0)), 0);
            const exerciseNames = [...new Set(sets.map((s: any) => s.exercise_name || 'Unknown'))] as string[];

            const exerciseSummaries = exerciseNames.map(name => {
                const exSets = sets.filter((s: any) => (s.exercise_name || 'Unknown') === name);
                const bestSet = exSets.reduce((best: any, cur: any) => {
                    if (Number(cur.weight || 0) > Number(best.weight || 0)) return cur;
                    const bestVol = Number(best.weight || 0) * Number(best.reps || 0);
                    const curVol = Number(cur.weight || 0) * Number(cur.reps || 0);
                    return curVol > bestVol ? cur : best;
                }, exSets[0]);
                return {
                    name,
                    sets: exSets.length,
                    volume: exSets.reduce((acc: number, s: any) => acc + Number(s.weight || 0) * Number(s.reps || 0), 0),
                    bestWeight: Number(bestSet?.weight || 0),
                    bestReps: Number(bestSet?.reps || 0),
                    bestEstimatedOneRepMax: Math.round(Number(bestSet?.weight || 0) * (1 + Number(bestSet?.reps || 0) / 30) * 10) / 10,
                };
            });

            enrichedLogs.push({
                id: session.id,
                date: session.date,
                duration: Math.floor((session.duration_seconds || 0) / 60),
                routineName: session.name,
                volume,
                exercises: exerciseNames,
                setsCount: sets.length,
                exerciseSummaries,
                sets: sets.map((s: any) => ({
                    id: s.id,
                    exerciseId: s.exercise_id,
                    exerciseName: s.exercise_name || 'Unknown',
                    setNumber: s.set_number,
                    weight: Number(s.weight || 0),
                    reps: Number(s.reps || 0),
                    volume: Number(s.weight || 0) * Number(s.reps || 0),
                    estimatedOneRepMax: Math.round(Number(s.weight || 0) * (1 + Number(s.reps || 0) / 30) * 10) / 10,
                })),
            });
        }
        return enrichedLogs;
    }

    static async getLastSessionForRoutine(routineName: string): Promise<WorkoutLog | null> {
        const db = await getDatabase();
        const sessions = await db.getAllAsync<any>(
            'SELECT * FROM workout_sessions WHERE name = ? ORDER BY date DESC LIMIT 1',
            [routineName]
        );
        if (sessions.length === 0) return null;

        const session = sessions[0];
        const sets = await db.getAllAsync<any>(
            'SELECT * FROM workout_sets_v2 WHERE session_id = ? ORDER BY id ASC',
            [session.id]
        );

        return {
            id: session.id,
            routineId: null,
            date: session.date,
            durationSeconds: session.duration_seconds,
            notes: session.notes,
            sets: sets.map((s: any) => ({
                id: s.id,
                exerciseId: s.exercise_id,
                weight: s.weight,
                reps: s.reps,
                setNumber: s.set_number,
                type: 'Normal',
            })),
        };
    }

    static async getExerciseHistory(exerciseId: number): Promise<any[]> {
        const db = await getDatabase();
        return db.getAllAsync<any>(
            `SELECT ws.*, s.date, s.name as session_name
             FROM workout_sets_v2 ws
             JOIN workout_sessions s ON ws.session_id = s.id
             WHERE ws.exercise_id = ?
             ORDER BY s.date ASC`,
            [exerciseId]
        );
    }

    static async getWorkoutDates(userId: number): Promise<string[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<{ date: string }>(
            'SELECT date FROM workout_sessions WHERE user_id = ? AND status = ? ORDER BY date DESC',
            [userId, 'COMPLETED']
        );
        return rows.map(r => r.date);
    }
}

export default WorkoutSessionRepository;
