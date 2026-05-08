import { getDatabase } from '../db/database';
import { UserSchema, UpdateUserSchema } from '../db/validation';

export interface User {
    id: number;
    name: string | null;
    gender: string | null;
    age: number | null;
    height: number | null;
    weight: number | null;
    activityLevel: string | null;
    goal: string | null;
    targetCalories: number | null;
    targetProtein: number | null;
    targetCarbs: number | null;
    targetFats: number | null;
    picture: string | null;
    createdAt?: string | null;
}

export interface NewUser {
    id?: number;
    name?: string | null;
    gender?: string | null;
    age?: number | null;
    height?: number | null;
    weight?: number | null;
    activityLevel?: string | null;
    goal?: string | null;
    targetCalories?: number | null;
    targetProtein?: number | null;
    targetCarbs?: number | null;
    targetFats?: number | null;
    picture?: string | null;
}

function mapDbUser(row: any): User {
    return {
        id: row.id,
        name: row.name,
        gender: row.gender,
        age: row.age,
        height: row.height,
        weight: row.weight,
        activityLevel: row.activity_level,
        goal: row.goal,
        targetCalories: row.target_calories,
        targetProtein: row.target_protein,
        targetCarbs: row.target_carbs,
        targetFats: row.target_fats,
        picture: row.picture,
        createdAt: row.created_at,
    };
}

export const UserRepository = {
    async getCurrentUser(): Promise<User | null> {
        try {
            const db = await getDatabase();
            const result = await db.getFirstAsync<any>('SELECT * FROM users LIMIT 1');
            return result ? mapDbUser(result) : null;
        } catch (e) {
            console.error('Error fetching user:', e);
            return null;
        }
    },

    async createUser(userData: NewUser): Promise<User | null> {
        try {
            const validatedData = UserSchema.parse(userData);
            const db = await getDatabase();
            const result = await db.runAsync(
                `INSERT INTO users (
                    name, gender, age, height, weight, activity_level, goal,
                    target_calories, target_protein, target_carbs, target_fats, picture
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    validatedData.name ?? null,
                    validatedData.gender ?? null,
                    validatedData.age ?? null,
                    validatedData.height ?? null,
                    validatedData.weight ?? null,
                    validatedData.activityLevel ?? null,
                    validatedData.goal ?? null,
                    validatedData.targetCalories ?? null,
                    validatedData.targetProtein ?? null,
                    validatedData.targetCarbs ?? null,
                    validatedData.targetFats ?? null,
                    validatedData.picture ?? null,
                ]
            );
            const created = await db.getFirstAsync<any>('SELECT * FROM users WHERE id = ?', [result.lastInsertRowId]);
            return created ? mapDbUser(created) : null;
        } catch (e) {
            console.error('Error creating user / Validation fail:', e);
            return null;
        }
    },

    async updateUser(id: number, updates: Partial<NewUser>): Promise<User | null> {
        try {
            const validatedUpdates = UpdateUserSchema.parse(updates);
            const db = await getDatabase();
            const assignments: string[] = [];
            const values: any[] = [];

            const columnMap: Record<string, string> = {
                name: 'name',
                gender: 'gender',
                age: 'age',
                height: 'height',
                weight: 'weight',
                activityLevel: 'activity_level',
                goal: 'goal',
                targetCalories: 'target_calories',
                targetProtein: 'target_protein',
                targetCarbs: 'target_carbs',
                targetFats: 'target_fats',
                picture: 'picture',
            };

            Object.entries(validatedUpdates).forEach(([key, value]) => {
                const column = columnMap[key];
                if (!column) return;
                assignments.push(`${column} = ?`);
                values.push(value ?? null);
            });

            if (assignments.length > 0) {
                values.push(id);
                await db.runAsync(`UPDATE users SET ${assignments.join(', ')} WHERE id = ?`, values);
            }

            const updated = await db.getFirstAsync<any>('SELECT * FROM users WHERE id = ?', [id]);
            return updated ? mapDbUser(updated) : null;
        } catch (e) {
            console.error('Error updating user / Validation fail:', e);
            return null;
        }
    }
};
