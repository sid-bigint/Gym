# Hybrid Architecture Implementation Plan

## Feasibility Analysis
**Can we execute this?**
**YES.** The architecture outlined in the images (Local SQLite + Cloud Sync) is the industry standard for high-quality, offline-first applications.

**Can we use Firebase?**
**YES.** You are already using Firebase Authentication. We can enable **Cloud Firestore** for the database storage and **Firebase Storage** for media (images). Storing users' data in Firestore allows for cross-device syncing and cloud backups.

---

## The Master Plan

We will move from the "Current Architecture" (Direct SQL in Stores) to the "Improved Hybrid Architecture" (Repository Pattern + Sync Engine).

### Phase 1: The Foundation (Clean Code & Drizzle)
**Goal:** Stop writing raw SQL inside your UI/Stores and introduce a Type-Safe ORM.
*   **What I Will Do:**
    *   Install and configure `drizzle-orm` and `drizzle-kit`.
    *   Create **Schema Definitions** in TypeScript for all your tables (`users`, `workouts`, `routines`, etc.).
    *   Create a **Repository Layer** (e.g., `UserRepository`, `WorkoutRepository`) to handle all database interactions.
    *   Refactor `useUserStore` and other stores to use these Repositories instead of raw SQL.
*   **What You Will Do:**
    *   Review the code to ensure I haven't broken existing features.
    *   Verify that the app runs smoothly with the new ORM layer.

### Phase 2: Data Validation & Integrity
**Goal:** Ensure no bad data ever enters the database.
*   **What I Will Do:**
    *   Install `zod`.
    *   Create Zod schemas that mirror the database structure.
    *   Add validation checks in the Repository layer (e.g., preventing a workout creation without a valid `user_id`).
*   **What You Will Do:**
    *   Test "edge cases" (try to enter invalid weight, empty names) to see if the validation catches it.

### Phase 3: Cloud Infrastructure Setup
**Goal:** Prepare the cloud backend.
*   **What I Will Do:**
    *   Update the app configuration to include Firestore dependencies.
    *   Create a `FirebaseRepository` that mirrors the local methods but talks to the cloud.
*   **What You Will Do:**
    *   **Go to Firebase Console:** Enable "Firestore Database".
    *   **Security Rules:** proper rules to ensure users can only read/write their own data (I will provide the rules text, you paste it in).
    *   **Google Services:** Ensure `google-services.json` is up to date if we add new services.

### Phase 4: The Sync Engine (The "Magic")
**Goal:** Sync local data to the cloud automatically.
*   **What I Will Do:**
    *   Create a **Sync Queue** table in the local database to track offline changes.
    *   Build a **Sync Service** that checks network connectivity.
    *   Implement the logic: *When User saves Workout -> Save to Local DB -> Add to Sync Queue -> Try to Push to Cloud.*
*   **What You Will Do:**
    *   **Heavy Testing:** Turn off your phone's internet, do a workout, turn internet back on. Check if it appears in the Firebase Console.

---

## Immediate Next Steps
If you approve this plan, we will start with **Phase 1**.

**Action Item:** Shall I begin by installing `drizzle-orm` and setting up the initial Schema for the `users` table?
