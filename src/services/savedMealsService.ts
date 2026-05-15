import { getDatabase } from '../db/database';
import { CloudSyncService } from './cloudSyncService';

export interface SavedMealItem {
    id: string;
    name: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export interface SavedMeal {
    id: number;
    userId: number;
    name: string;
    items: SavedMealItem[];
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    createdAt?: string;
}

function mapSavedMeal(row: any): SavedMeal {
    let items: SavedMealItem[] = [];
    try {
        items = JSON.parse(row.items_json || '[]');
    } catch {
        items = [];
    }

    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        items,
        calories: Number(row.calories || 0),
        protein: Number(row.protein || 0),
        carbs: Number(row.carbs || 0),
        fats: Number(row.fats || 0),
        createdAt: row.created_at,
    };
}

export async function getSavedMeals(userId: number): Promise<SavedMeal[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
        'SELECT * FROM saved_meals WHERE user_id = ? ORDER BY id DESC',
        [userId]
    );
    return rows.map(mapSavedMeal);
}

export async function addSavedMeal(
    userId: number,
    name: string,
    items: SavedMealItem[],
): Promise<SavedMeal> {
    const db = await getDatabase();
    const totals = items.reduce(
        (acc, item) => ({
            calories: acc.calories + Number(item.calories || 0),
            protein: acc.protein + Number(item.protein || 0),
            carbs: acc.carbs + Number(item.carbs || 0),
            fats: acc.fats + Number(item.fats || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const result = await db.runAsync(
        `INSERT INTO saved_meals (user_id, name, items_json, calories, protein, carbs, fats)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            name.trim(),
            JSON.stringify(items),
            Math.round(totals.calories),
            Math.round(totals.protein * 10) / 10,
            Math.round(totals.carbs * 10) / 10,
            Math.round(totals.fats * 10) / 10,
        ]
    );
    CloudSyncService.scheduleBackup('saved-meal-created');

    return {
        id: Number(result.lastInsertRowId),
        userId,
        name: name.trim(),
        items,
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fats: Math.round(totals.fats * 10) / 10,
    };
}

export async function deleteSavedMeal(id: number, userId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM saved_meals WHERE id = ? AND user_id = ?', [id, userId]);
    CloudSyncService.scheduleBackup('saved-meal-deleted');
}

export async function updateSavedMeal(
    id: number,
    userId: number,
    name: string,
    items: SavedMealItem[]
): Promise<void> {
    const db = await getDatabase();
    const totals = items.reduce(
        (acc, item) => ({
            calories: acc.calories + Number(item.calories || 0),
            protein: acc.protein + Number(item.protein || 0),
            carbs: acc.carbs + Number(item.carbs || 0),
            fats: acc.fats + Number(item.fats || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    await db.runAsync(
        `UPDATE saved_meals 
         SET name = ?, items_json = ?, calories = ?, protein = ?, carbs = ?, fats = ?
         WHERE id = ? AND user_id = ?`,
        [
            name.trim(),
            JSON.stringify(items),
            Math.round(totals.calories),
            Math.round(totals.protein * 10) / 10,
            Math.round(totals.carbs * 10) / 10,
            Math.round(totals.fats * 10) / 10,
            id,
            userId
        ]
    );
    CloudSyncService.scheduleBackup('saved-meal-updated');
}
