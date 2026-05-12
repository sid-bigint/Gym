# Application Architecture & Codebase Audit Report

## 🚨 1. Critical Bugs & Data Inconsistencies Fixed

During the audit, I discovered a **major data inconsistency bug** related to the database schema migration:

*   **The Issue:** The application recently migrated its data model from legacy tables (`workouts`, `workout_sets`) to a new Phase 1 schema (`workout_sessions`, `workout_sets_v2`). However, the `app/workout/summary.tsx` screen was still querying the legacy `workout_sets` table using the old `workout_id` foreign key. 
*   **The Impact:** When a user finished a workout, it would save successfully to the new tables, but the Summary screen would crash or show empty stats because it was looking in the old, deprecated tables.
*   **The Fix:** I updated `app/workout/summary.tsx` to correctly query `SELECT * FROM workout_sets_v2 WHERE session_id = ?` and updated all internal Javascript filtering logic to use `session_id` instead of `workout_id`.

## ⚠️ 2. Technical Debt & Anomalies

*   **Lingering Legacy Schema:** The `src/db/schema.ts` file still contains definitions for the old `workouts` and `workout_sets` tables alongside the new `v2` tables. While this is standard for a migration period to prevent data loss, you should eventually write a script to migrate any old data to the new tables and drop the legacy tables entirely to prevent future confusion.
*   **Raw SQL in Zustand Stores:** Files like `src/store/useWorkoutStore.ts` contain massive raw SQLite strings (`db.runAsync('INSERT INTO...')`). While performant, this tightly couples your state management to your database layer. 
    *   *Recommendation:* Move all raw SQL queries into dedicated repository files (like `WorkoutSessionRepository.ts`) and have the Zustand store call the repository methods.

## 🚀 3. UI/UX & Codebase Improvement Plan

The application's UI is beautiful and feature-rich, but several key screens have become monolithic, which can lead to performance degradation (especially in React Native).

### Refactoring `app/(tabs)/routines.tsx`
This file is currently ~900 lines long. To improve maintainability and scrolling performance:
1.  **Extract Components:** The `renderRoutineData` and `renderProgramCard` functions are complex and defined inside the main component. They should be extracted into their own files (e.g., `src/components/RoutineCard.tsx`, `src/components/ProgramCard.tsx`).
2.  **Optimize `FlatList`:** Currently, `routines.tsx` uses a `FlatList` wrapped inside a `ScrollView` with `scrollEnabled={false}`. This completely defeats the memory-saving virtualization benefits of `FlatList`. 
    *   *Fix:* Remove the wrapping `ScrollView` and use the `ListHeaderComponent` prop of the `FlatList` to render all the content above the list (Quick Actions, Banners, etc.).
3.  **Memoize Callbacks:** Functions passed to `onPress` inside the list items are recreated on every render. Wrap them in `useCallback` to prevent unnecessary re-renders of the list items.

### Refactoring `app/(tabs)/history.tsx`
This file is over 1,000 lines long and handles heavy data transformation for charts.
1.  **Extract Data Transformation:** The `useMemo` hooks calculating `chartData`, `nutritionCharts`, `bodyCharts`, and `trainingAnalytics` are extremely heavy. Move this math into a dedicated utility file (e.g., `src/utils/analyticsMath.ts`).
2.  **Extract Chart Views:** The screen conditionally renders entirely different UI layouts based on `viewMode` and `subViewMode`. Break these down into smaller sub-components: `<HistoryListView />`, `<TrainingInsightsView />`, `<NutritionInsightsView />`.

### State Management Enhancements
1.  **Pagination:** Currently, `getWorkoutHistory(50)` loads the last 50 workouts at once. As the user uses the app for months, this will slow down the History tab. Implement infinite scrolling / pagination in `useWorkoutStore.ts`.
2.  **Optimistic UI Updates:** When deleting a routine or workout, update the Zustand array immediately, then fire the database deletion in the background. This makes the UI feel instantly responsive.
