import { getDatabase } from '../db/database';
import type { Exercise, Routine, RoutineExercise } from '../types';

interface RoutineAnalytics {
    lastPerformed: string;
    avgDuration: number;
}

export interface LoadRoutinesResult {
    routines: Routine[];
    analytics: Record<string, RoutineAnalytics>;
}

export interface InsertExerciseParams {
    name: string;
    muscleGroup: string;
    type?: string;
    instructions?: string[];
    images?: string[];
}

export interface RoutineExerciseInput {
    exerciseId: number;
    sets: number;
    reps: number;
}

export class RoutineRepository {
    static async getExercises(): Promise<Exercise[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<any>('SELECT * FROM exercises ORDER BY name ASC', []);
        return rows.map(ex => {
            let instructions: string[] = [];
            let images: string[] = [];
            try {
                if (ex.instructions) instructions = JSON.parse(ex.instructions);
                if (ex.images) images = JSON.parse(ex.images);
            } catch { }
            return {
                id: ex.id,
                name: ex.name,
                muscleGroup: ex.muscle_group,
                type: ex.type,
                isCustom: !!ex.is_custom,
                instructions,
                images,
            };
        });
    }

    static async insertExercise(params: InsertExerciseParams, userId: number | null): Promise<Exercise> {
        const db = await getDatabase();
        const result = await db.runAsync(
            'INSERT INTO exercises (name, muscle_group, type, is_custom, instructions, images, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                params.name,
                params.muscleGroup,
                params.type || 'General',
                1,
                params.instructions ? JSON.stringify(params.instructions) : null,
                params.images ? JSON.stringify(params.images) : null,
                userId,
            ]
        );
        return {
            id: result.lastInsertRowId,
            name: params.name,
            muscleGroup: params.muscleGroup,
            type: params.type || 'General',
            isCustom: true,
            instructions: params.instructions || [],
            images: params.images || [],
        };
    }

    static async removeExercise(id: number): Promise<void> {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM exercises WHERE id = ? AND is_custom = 1', [id]);
    }

    static async getRoutinesWithExercises(userId: number): Promise<LoadRoutinesResult> {
        const db = await getDatabase();

        const rawRoutines = await db.getAllAsync<any>(
            'SELECT * FROM routines WHERE user_id = ? OR program_id IS NOT NULL',
            [userId]
        );

        const routineIds = rawRoutines
            .map((r: any) => r.id)
            .filter((id: any): id is number => typeof id === 'number');

        const exerciseRows = routineIds.length > 0
            ? await db.getAllAsync<any>(
                `SELECT re.*, e.name, e.muscle_group, e.type, e.instructions, e.images
                 FROM routine_exercises re
                 JOIN exercises e ON re.exercise_id = e.id
                 WHERE re.routine_id IN (${routineIds.map(() => '?').join(', ')})
                 ORDER BY re.routine_id ASC, re.order_index ASC`,
                routineIds
            )
            : [];

        const byRoutineId = new Map<number, any[]>();
        for (const row of exerciseRows) {
            const list = byRoutineId.get(row.routine_id);
            if (list) {
                list.push(row);
            } else {
                byRoutineId.set(row.routine_id, [row]);
            }
        }

        const routines: Routine[] = rawRoutines.map((r: any) => ({
            id: r.id,
            name: r.name,
            programId: r.program_id,
            isPinned: !!r.is_pinned,
            orderIndex: r.order_index || 0,
            description: r.description,
            exercises: (byRoutineId.get(r.id) || []).map((re: any) => {
                let instructions: string[] = [];
                let images: string[] = [];
                try {
                    if (re.instructions) instructions = JSON.parse(re.instructions);
                    if (re.images) images = JSON.parse(re.images);
                } catch { }
                return {
                    id: re.id,
                    exerciseId: re.exercise_id,
                    sets: re.sets || 3,
                    reps: re.reps || 10,
                    exercise: {
                        id: re.exercise_id,
                        name: re.name,
                        muscleGroup: re.muscle_group,
                        type: re.type,
                        isCustom: false,
                        instructions,
                        images,
                    },
                } as RoutineExercise;
            }),
        }));

        const analyticsRows = await db.getAllAsync<any>(
            `SELECT name, MAX(date) as lastPerformed, AVG(duration_seconds) as avgDuration
             FROM workout_sessions
             WHERE status = 'COMPLETED' AND name IS NOT NULL
             GROUP BY name`
        );

        const analytics: Record<string, RoutineAnalytics> = {};
        for (const row of analyticsRows) {
            if (row.name) {
                analytics[row.name] = {
                    lastPerformed: row.lastPerformed,
                    avgDuration: row.avgDuration,
                };
            }
        }

        return { routines, analytics };
    }

    static async insertRoutine(
        name: string,
        exerciseList: RoutineExerciseInput[],
        programId: string | null,
        userId: number
    ): Promise<number> {
        const db = await getDatabase();
        let routineId = 0;
        await db.withTransactionAsync(async () => {
            const result = await db.runAsync(
                'INSERT INTO routines (name, program_id, user_id) VALUES (?, ?, ?)',
                [name, programId, userId]
            );
            routineId = result.lastInsertRowId;
            for (let i = 0; i < exerciseList.length; i++) {
                const item = exerciseList[i];
                const exerciseId = parseInt(String(item.exerciseId), 10);
                const sets = parseInt(String(item.sets), 10) || 3;
                const reps = parseInt(String(item.reps), 10) || 10;
                if (isNaN(exerciseId)) continue;
                await db.runAsync(
                    'INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps) VALUES (?, ?, ?, ?, ?)',
                    [routineId, exerciseId, i, sets, reps]
                );
            }
        });
        return routineId;
    }

    static async updateRoutine(
        id: number,
        name: string,
        exerciseList: RoutineExerciseInput[]
    ): Promise<void> {
        const db = await getDatabase();
        await db.withTransactionAsync(async () => {
            await db.runAsync('UPDATE routines SET name = ? WHERE id = ?', [name, id]);
            await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', [id]);
            for (let i = 0; i < exerciseList.length; i++) {
                const item = exerciseList[i];
                const exerciseId = parseInt(String(item.exerciseId), 10);
                const sets = parseInt(String(item.sets), 10) || 3;
                const reps = parseInt(String(item.reps), 10) || 10;
                if (isNaN(exerciseId)) continue;
                await db.runAsync(
                    'INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps) VALUES (?, ?, ?, ?, ?)',
                    [id, exerciseId, i, sets, reps]
                );
            }
        });
    }

    static async removeRoutine(id: number): Promise<void> {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', [id]);
        await db.runAsync('DELETE FROM routines WHERE id = ?', [id]);
    }

    static async setPinned(id: number, isPinned: boolean): Promise<void> {
        const db = await getDatabase();
        await db.runAsync('UPDATE routines SET is_pinned = ? WHERE id = ?', [isPinned ? 1 : 0, id]);
    }
}

export default RoutineRepository;
