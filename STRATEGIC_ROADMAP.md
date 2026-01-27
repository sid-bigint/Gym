# GymNative Strategic Analysis & Implementation Roadmap

**Generated:** January 2026
**Status:** Approved for Implementation

---

## 1. Executive Summary

GymNative (GymGuide360) possesses a **solid technical foundation** (scored 8/10) due to its offline-first architecture, TypeScript/Zod validation, and Drizzle ORM integration. However, it currently lacks critical fitness application features (scored 3/10 on feature completeness), specifically a workout logging system, which prevents it from competing effectively in the market.

**The Strategy:**
Leverage the robust offline-first architecture to build a best-in-class, distraction-free workout logger, then overlay an AI Intelligence Layer (Claude API) to provide personalized coaching—a killer differentiator against competitors like Strong or Hevy.

### Key Strengths (Keep & Build Upon)
*   **Offline-first Architecture:** Critical for basement gyms.
*   **Tech Stack:** TypeScript + Drizzle ORM + Expo is scalable and maintainable.
*   **Hybrid Auth:** Good UX with Google + Guest access.

### Critical Gaps (Immediate Focus)
*   **Missing Workout Logging:** The core utility of the app does not exist.
*   **No Progress Tracking:** Users cannot visualize their gains (volume, weight, body stats).
*   **Static Data:** reliance on local JSONs limits updates.

---

## 2. Recommended Database Schema Changes

To support the Core Workout System (Phase 1), we must expand the SQLite schema.

### New Tables Required

#### `workout_sessions`
Represents a single performed workout.
```typescript
{
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id), // Link to user
  name: text('name'), // e.g., "Monday Chest Day" or "Pull Workout"
  date: text('date').notNull(), // ISO Date
  duration: integer('duration_seconds'), // Total time spent
  notes: text('notes'),
  status: text('status').default('COMPLETED'), // 'IN_PROGRESS', 'COMPLETED'
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
}
```

#### `exercises` (Dynamic Library)
Replaces static `exerciseData.json` for better queryability and custom exercises.
```typescript
{
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group'), // 'Chest', 'Back', etc.
  equipment: text('equipment'), // 'Dumbbell', 'Barbell', etc.
  videoUrl: text('video_url'),
  isCustom: integer('is_custom').default(0), // 1 for user-created
  userId: integer('user_id'), // Null for global, set for custom
}
```

#### `workout_sets` (The Atomic Unit)
Stores each individual set performed.
```typescript
{
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').references(() => workoutSessions.id).notNull(),
  exerciseId: integer('exercise_id').references(() => exercises.id).notNull(),
  setNumber: integer('set_number').notNull(), // 1, 2, 3...
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
  rpe: real('rpe'), // Rate of Perceived Exertion (optional)
  timestamp: text('timestamp').default('CURRENT_TIMESTAMP'),
}
```

---

## 3. Phased Implementation Roadmap

### 🔴 Phase 1: Core Workout System (Months 1-2)
**Objective:** Build the missing foundation. The app must be a functional logger.
*   **Priority:** CRITICAL
*   **Key Deliverables:**
    1.  **Schema Migration:** Create workout-related tables.
    2.  **Exercise Library:** Migrate JSON data to SQLite `exercises` table.
    3.  **Active Workout UI:** "Start Workout" flow, set/rep input, rest timer.
    4.  **History & Logs:** View past workouts.
    5.  **Basic Analytics:** Volume per workout.

### 🟠 Phase 2: AI Intelligence Layer (Months 3-4)
**Objective:** Add competitive differentiators.
*   **Priority:** HIGH
*   **Key Deliverables:**
    1.  **AI Workout Generator:** Claude API integration to build routines based on equipment/time.
    2.  **Conversational Coach:** Chat interface for fitness Q&A.
    3.  **Form Check:** (Experimental) Video analysis via MediaPipe.

### 🟡 Phase 3: Engagement & Social (Months 5-6)
**Objective:** Build community and retention.
*   **Priority:** MEDIUM
*   **Key Deliverables:**
    1.  **Friends System:** Follow users, view feeds.
    2.  **Challenges:** 30-day consistency challenges.
    3.  **Badges:** Gamification for milestones.

### 🟢 Phase 4: Polish & Monetization (Months 7-8)
**Objective:** Premium features and revenue.
*   **Priority:** LOW (for now)
*   **Key Deliverables:**
    1.  **Wearable Sync:** Apple Health / Google Fit.
    2.  **Premium Subscription:** Unlock AI features.
    3.  **Advanced Dashboards:** 1RM estimates, trend lines.

---

## 4. Phase 1: Detailed Task Breakdown

This is the actionable plan for the immediate future.

### Milestone 1.1: Database & Data Migration
- [x] **Task 1:** Update `src/db/schema.ts` to include `workout_sessions`, `exercises`, and `workout_sets`.
- [x] **Task 2:** Create a migration script/utility to seed `exercises` table from `exerciseData.json` on app launch.
- [x] **Task 3:** Create `useWorkoutStore` with Zustand + Drizzle for actions (startWorkout, addSet, finishWorkout).

### Milestone 1.2: Exercise Selection & Management
- [x] **Task 4:** Create `ExercisePicker` component (Modal) with search and muscle group filters.
- [x] **Task 5:** Implement "Create Custom Exercise" form (updates `exercises` table).
- [x] **Task 5.1:** Implement "Delete Custom Exercise" functionality (UI & Store action).

### Milestone 1.3: Active Workout Interface (Critical)
- [x] **Task 6:** Create `ActiveWorkoutScreen` shell.
- [x] **Task 7:** Implement `ExerciseCard` component (displays exercise name + list of sets).
- [x] **Task 8:** Implement `SetInputRow` component (Weight, Reps, Tick button).
- [x] **Task 9:** Implement `RestTimer` overlay (auto-starts on set completion).

### Milestone 1.4: Post-Workout & History
- [x] **Task 10:** Update Dashboard to show an "Active Workout" card if a session is in progress (persistence).
- [x] **Task 11:** Create `HistoryScreen` to list past sessions.

## 5. Phase 2: AI Intelligence Layer (Up Next)
### Milestone 2.1: Smart Routine Generation
- [x] **Task 12:** Integrate Claude API helper functions.
- [x] **Task 13:** Create "Generate Workout" form (Input: Splits, Equipment, Time).
- [x] **Task 14:** Parse AI response into `routines` and `exercises`.
*   **Time to Value:** User can log a set within 30s of opening the app.
*   **Stability:** Crash-free session rate > 99.5%.
*   **Engagement:** Average 3+ workouts logged per week per active user.
