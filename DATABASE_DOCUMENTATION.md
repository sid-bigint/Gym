# User Database Documentation

## Overview
This document outlines the architecture, implementation, and future improvements for the user database in the Gym application.

**Current Tech Stack:**
- **Database Engine:** [SQLite](https://www.sqlite.org/index.html) (via `expo-sqlite`)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Type Safety:** TypeScript

## 1. Why We Are Using This Stack?

### Local-First Architecture
We are using a **Local-First** approach. User data lives primarily on their device (in the SQLite database).
- **Offline Capability:** Critical for a gym app. Users can log workouts without an internet connection.
- **Privacy:** Health data remains on the user's device by default.
- **Speed:** Reading from disk is significantly faster than fetching from a cloud API.

## 2. How the Database is Implemented

### The "Separated" Database File
The database is contained within a single file on the device filesystem.
- **Filename:** `gym_app_v8.db`
- **Location:** App's secure document storage (managed by Android/iOS).

### Connection Pattern
We use a **Singleton Pattern** to ensure only one connection to the database is open at a time.
*File: `src/db/database.ts`*
```typescript
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('gym_app_v8.db');
  }
  return dbInstance;
}
```

### Initialization & Migrations
On app launch, `initDatabase()` is called. It handles:
1.  **Table Creation:** Creates tables if they don't exist.
2.  **Migrations:** Checks if specific columns (like `picture` in `users` or `user_id` in `workouts`) exist and adds them if strictly necessary. This prevents data loss during app updates.
3.  **Seeding:** Populates the `exercises` table with default data from `exerciseData.json` if it's empty.

## 3. Storage Layer: How Data is Stored

Data is relational. Key relationships are linked via foreign keys (IDs).

### Core Tables

#### `users`
Stores user profile information.
- **Key Columns:** `id` (PK), `name`, `target_calories`, `picture`.
- **Usage:** Fetched by `useUserStore`.

#### `routines` & `routine_exercises`
Defines the workout plans.
- **Relation:** A `routine` has many `exercises` via the `routine_exercises` bridge table.

#### `workouts` & `workout_sets`
Stores the history of performed exercises.
- **Relation:** A `workout` has many `workout_sets`.
- **Isolation:** Contains `user_id` to link history to a specific user.

## 4. User Isolation Strategy: Avoiding the "Mess"

You asked: *"How are we separating the users database... and isolate every database so they dont create mess?"*

### Current Strategy: Logical Isolation
Currently, we use **Logical Isolation** within a single database file.
- **Mechanism:** Nearly every table has a `user_id` column.
- **How it works:** When we query for workouts, we *should* strictly query `WHERE user_id = ?`.
- **Benefit:** Allows a single app installation to potentially handle multiple profiles (or simply ensure data integrity) without creating dozens of physical `.db` files.

### Why not separate physical files per user?
Creating a separate `user_1.db`, `user_2.db` is possible but often introduces complexity in:
- **Connection Management:** You have to close/open connections whenever the active user changes.
- **Migrations:** You would have to run schema updates on *every single file* independently.

## 5. Recommendations for Improvement

To make the system "better" and prevent "mess" (spaghetti code, data corruption, or mixed-up user data), we recommend the following evolution:

### A. dedicated Repository Layer (Clean Architecture)
Currently, raw SQL (`INSERT INTO...`) is written inside Zustand stores (`useUserStore.ts`).
**Improvement:** Move all SQL to a dedicated `api/` or `repositories/` folder.
*   `src/repositories/userRepository.ts`
*   `src/repositories/workoutRepository.ts`
*   *Why?* The Store should just ask for data, not worry about SQL syntax.

### B. Adopt an ORM (Drizzle ORM)
Writing raw SQL strings (`"SELECT * FROM..."`) is error-prone.
**Improvement:** Use **Drizzle ORM** with `expo-sqlite`.
- **Type Safety:** TypeScript will error if you try to query a column that doesn't exist.
- **Schema Management:** Drizzle manages `CREATE TABLE` and migrations automatically.
- **Better Isolation:** You can enforce `where: eq(workouts.userId, activeUserId)` easily in queries.

### C. Strict Foreign Keys
Verification of `PRAGMA foreign_keys = ON` is already in place. Ensure we strictly use `CASCADE` deletes.
*Example:* If a User is deleted, all their Workouts should auto-delete.
```sql
user_id TEXT REFERENCES users(id) ON DELETE CASCADE
```

### D. Validation (Zod)
Use **Zod** to validate data *before* it enters the database. Ensure that `user_id` is never null when creating a workout.

---

## Summary of Data Flow

1.  **UI Component** (e.g., `ProfileScreen`) triggers an action.
2.  **Store** (`useUserStore`) receives the action.
3.  **Database Layer** (`getDatabase()`) executes SQL.
4.  **SQLite File** (`gym_app_v8.db`) persists the change.
