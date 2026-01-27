# GymNative Application Documentation

## 1. Application Overview
**GymNative** (also referred to as GymGuide360) is a comprehensive personal fitness companion application designed to help users track their workouts, nutrition, and fitness goals. 

**Key Features:**
- **User Profiling:** Tracks age, gender, height, weight, activity levels, and specific fitness goals (e.g., lose weight, gain muscle).
- **Nutrition Tracking:** Log daily meals with macro-nutrient breakdowns (Calories, Protein, Carbs, Fats).
- **Workout Management:** (Implied) Manage and track workout routines.
- **Offline Capabilities:** Built with an offline-first architecture, allowing users to log data without internet connectivity, which is synced when online.
- **Hybrid Authentication:** Supports both secure Google Sign-In and anonymous Guest access.

## 2. Technology Stack

### Core Framework
- **Runtime:** [React Native](https://reactnative.dev/) (v0.81.5) via [Expo](https://expo.dev/) (SDK 54)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (v5.9.2)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (v6)

### Data & State Management
- **Database (Local):** [SQLite](https://www.sqlite.org/index.html) running via `expo-sqlite`.
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) for type-safe database interactions.
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) for global client-side state.
- **Data Validation:** [Zod](https://zod.dev/) for schema validation.
- **Utilities:** `date-fns` for date manipulation.

### Authentication
- **Provider:** [Firebase Authentication](https://firebase.google.com/docs/auth) (v12.8.0).
- **Google Sign-In:** Uses native `@react-native-google-signin/google-signin` for obtaining ID Tokens.
- **Guest Access:** Firebase Anonymous Login.

### UI & Styling
- **Styling Engine:** React Native StyleSheet & `expo-linear-gradient`.
- **Icons:** `@expo/vector-icons` (Ionicons).
- **Animations:** `react-native-reanimated` & `react-native-gesture-handler`.
- **Charts:** `react-native-chart-kit` for data visualization.

## 3. Data Infrastructure

### Database Schema
The application uses a local SQLite database with the following key tables (defined in `src/db/schema.ts`):

1.  **`users`**: Stores user profile data.
    *   Fields: `id`, `name`, `gender`, `age`, `height`, `weight`, `activityLevel`, `goal`, `targetCalories`, `targetProtein`, etc.
2.  **`nutrition_logs`**: Tracks daily food intake.
    *   Fields: `date`, `name`, `calories`, `macros` (protein/carbs/fats), `type` (breakfast/lunch/etc).
3.  **`pending_syncs`**: Manages offline-to-online data synchronization.
    *   Fields: `action` (e.g., UPDATE_USER), `payload` (JSON), `status`.

### JSON Data Files
The application uses static JSON files related to domain data, found in `src/data/`:
*   **`exerciseData.json`**: Likely contains a predefined list of exercises (names, muscle groups, instructions) to populate the workout picker.
*   **`foodDatabase.json`**: Likely contains a startup database of common foods with their nutritional values to facilitate easy logging.

## 4. Authentication Architecture

The application implements a robust authentication flow typically handled in `app/auth/login.tsx` and `src/store/useAuthStore.ts`:

1.  **Google Sign-In Flow:**
    *   Checks for Google Play Services availability.
    *   Uses `GoogleSignin.signIn()` to authenticate with the Google account on the device.
    *   Retrieves an `idToken`.
    *   Uses this token to create a credential (`GoogleAuthProvider.credential`).
    *   Signs in to Firebase with `signInWithCredential(auth, credential)`.
2.  **Guest Login:**
    *   Uses `signInAnonymously(auth)` to create a temporary session without credentials.
3.  **Session Management:**
    *   Authentication state is managed globally via **Zustand**.
    *   Tokens and user sessions are likely persisted using `AsyncStorage` or Firebase's built-in persistence to keep users logged in across app restarts.

## 5. Asset Management
Assets are located in the `assets/` directory:
*   **Images:** stored in `assets/images/`.
*   **Fonts/Icons:** Managed via Expo's asset system.
*   **Data:** Static JSON data is kept in `src/data` rather than the assets folder for easier import into TypeScript files.

## 6. Recommendations for Improvement

### Feature Enhancements
1.  **Cloud Synchronization:** Fully implement the backend logic for `pending_syncs` to ensure data is backed up to a cloud database (like Firestore or Postgres) so users can switch devices without losing data.
2.  **Social Sharing:** Allow users to share workout summaries or achievements to social media using `requestMediaLibraryPermissionsAsync` and view-shotting tools.
3.  **Barcode Scanner:** Integrate `expo-camera` to allow users to scan food barcodes for instant nutrition logging, matching against an external API (e.g., OpenFoodFacts).
4.  **Wearable Integration:** Use Apple HealthKit / Google Fit integrations to auto-import steps and burned calories.

### UI/UX Improvements
1.  **Theming System:** Transition from hardcoded hex colors (e.g., `#0f172a` in `login.tsx`) to a centralized user theme provider. This would easily enable a toggleable **Light/Dark mode**.
2.  **Onboarding Experience:** Enhance the Guest Login experience by allowing them to strict "migrate" their data to a Google account later without data loss.
3.  **Interactive Charts:** Leverage `react-native-chart-kit` to show weight trends and calorie intake over time on the dashboard.
4.  **Haptic Feedback:** Utilize `expo-haptics` on button presses and successful log actions to give the app a more premium, tactile feel.

### Codebase Health
1.  **Unit Testing:** Introduce Jest and specifically `react-test-renderer` or `testing-library/react-native` to test critical paths like calorie calculations and auth flows.
2.  **Strict Typing:** Ensure all API responses and JSON data imports have strict Zod schemas to prevent runtime errors from malformed data.
