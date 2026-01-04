import { getDatabase } from '../db/database';

export interface CustomFood {
    id?: number;
    userId: number;
    name: string;
    category: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export async function addCustomFood(food: Omit<CustomFood, 'id'>): Promise<number> {
    try {
        const db = await getDatabase();
        const result = await db.runAsync(
            'INSERT INTO custom_foods (user_id, name, category, calories, protein, carbs, fats) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [food.userId, food.name, food.category, food.calories, food.protein, food.carbs, food.fats]
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.error('Failed to add custom food:', error);
        throw error;
    }
}

export async function getUserCustomFoods(userId: number): Promise<CustomFood[]> {
    try {
        const db = await getDatabase();
        const foods = await db.getAllAsync<any>(
            'SELECT * FROM custom_foods WHERE user_id = ? ORDER BY name ASC',
            [userId]
        );
        return foods.map(f => ({
            id: f.id,
            userId: f.user_id,
            name: f.name,
            category: f.category,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fats: f.fats,
        }));
    } catch (error) {
        console.error('Failed to get custom foods:', error);
        return []; // Return empty array instead of crashing
    }
}

export async function deleteCustomFood(id: number): Promise<void> {
    try {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM custom_foods WHERE id = ?', [id]);
    } catch (error) {
        console.error('Failed to delete custom food:', error);
    }
}

export async function updateCustomFood(id: number, food: Partial<CustomFood>): Promise<void> {
    try {
        const db = await getDatabase();
        const updates: string[] = [];
        const values: any[] = [];

        if (food.name !== undefined) {
            updates.push('name = ?');
            values.push(food.name);
        }
        if (food.category !== undefined) {
            updates.push('category = ?');
            values.push(food.category);
        }
        if (food.calories !== undefined) {
            updates.push('calories = ?');
            values.push(food.calories);
        }
        if (food.protein !== undefined) {
            updates.push('protein = ?');
            values.push(food.protein);
        }
        if (food.carbs !== undefined) {
            updates.push('carbs = ?');
            values.push(food.carbs);
        }
        if (food.fats !== undefined) {
            updates.push('fats = ?');
            values.push(food.fats);
        }

        if (updates.length > 0) {
            values.push(id);
            await db.runAsync(
                `UPDATE custom_foods SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }
    } catch (error) {
        console.error('Failed to update custom food:', error);
    }
}
