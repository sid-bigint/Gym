import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// We use the same database file as the existing system
const DB_NAME = 'gym_app_v8.db';

// Create the database connection
export const expoDb = openDatabaseSync(DB_NAME);

// Export the Drizzle instance with schema support
export const db = drizzle(expoDb, { schema });
