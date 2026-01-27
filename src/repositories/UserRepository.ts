import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema';
import { UserSchema, UpdateUserSchema } from '../db/validation';

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const UserRepository = {
    // Get the single active user (Single User App assumption for now)
    async getCurrentUser(): Promise<User | null> {
        try {
            const result = await db.select().from(users).limit(1);
            return result[0] || null;
        } catch (e) {
            console.error('Error fetching user:', e);
            return null;
        }
    },

    async createUser(userData: NewUser): Promise<User | null> {
        try {
            // Validate data before insertion
            const validatedData = UserSchema.parse(userData);

            const result = await db.insert(users).values(validatedData as NewUser).returning();
            return result[0];
        } catch (e) {
            console.error('Error creating user / Validation fail:', e);
            return null;
        }
    },

    async updateUser(id: number, updates: Partial<NewUser>): Promise<User | null> {
        try {
            // Validate updates
            // We use safeParse here to allow for partial updates without checking required fields that aren't being updated
            // But UpdateUserSchema is already .partial(), so parse is fine.
            const validatedUpdates = UpdateUserSchema.parse(updates);

            const result = await db
                .update(users)
                .set(validatedUpdates as Partial<NewUser>)
                .where(eq(users.id, id))
                .returning();
            return result[0];
        } catch (e) {
            console.error('Error updating user / Validation fail:', e);
            return null;
        }
    }
};
