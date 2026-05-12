# Muscle Visualizer - Complete Feature Documentation

## Overview

The Muscle Visualizer is a comprehensive full-fledged system that helps users track, visualize, and analyze muscle engagement during workouts. It provides real-time insights into which muscles are being worked, recovery status, and detailed analytics.

## Features

### 1. **3D Interactive Muscle Visualization**
- Front and back anatomical body views
- Interactive SVG-based muscle diagram
- Color-coded muscles based on:
  - **Workout Intensity**: Purple (high) → Cyan (moderate) → Gray (minimal)
  - **Soreness/Fatigue**: Red (very sore) → Orange (moderately sore)
- Tap on muscles to view detailed statistics
- Smooth transitions between front/back views

### 2. **Recovery Status Tracking**
- Manual soreness rating (0-10 scale for each muscle)
- Automatic recovery status determination:
  - **FRESH**: Fully recovered, ready for intense training
  - **RECOVERING**: Some fatigue, can train lightly
  - **FATIGUED**: Muscle fatigue present, reduce volume
  - **SORE**: Muscle is sore, consider rest or light training
- Visual feedback with emoji indicators
- Per-muscle recovery notes

### 3. **Comprehensive Analytics**
- **Weekly Heatmap**: View muscle activity distribution across 7 days
- **Volume Distribution**: Bar charts showing total volume per muscle group
- **Intensity Tracking**: See which muscles received the most intense training
- **Progress Tracking**: Monitor trends over time

### 4. **Dashboard Integration**
- Quick stats overview widget
- Most-worked muscles display
- Recovery alerts
- Quick access links

## Database Schema

### `muscle_stats` Table
Stores daily volume and workout metrics per muscle group.

```sql
CREATE TABLE muscle_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    muscle_group TEXT NOT NULL,
    date TEXT NOT NULL,
    volume REAL DEFAULT 0,        -- Total volume (sets × reps × weight)
    set_count INTEGER DEFAULT 0,   -- Number of sets performed
    rep_count INTEGER DEFAULT 0,   -- Total reps across all sets
    intensity REAL DEFAULT 0       -- Average intensity (1-10 scale)
);
```

### `muscle_recovery` Table
Tracks soreness and recovery status per muscle per day.

```sql
CREATE TABLE muscle_recovery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    muscle_group TEXT NOT NULL,
    date TEXT NOT NULL,
    soreness INTEGER DEFAULT 0,              -- 0-10 scale
    recovery_status TEXT DEFAULT 'FRESH',    -- FRESH, FATIGUED, SORE, RECOVERING
    last_trained_date TEXT,                  -- When was this muscle last trained
    rest_days_since INTEGER DEFAULT 0        -- Days since last trained
);
```

## Core Components

### 1. **MuscleVisualizer** (`src/components/MuscleVisualizer.tsx`)
Main interactive visualization component.

**Props:**
- `muscleData: Map<MuscleGroup, MuscleData>` - Current muscle state data
- `onMuscleSelect?: (muscle: MuscleGroup) => void` - Callback when muscle is selected

**Features:**
- Front/back view toggle
- Pan gesture support
- Muscle selection with detailed info card
- Color legend

### 2. **MuscleRecoveryTracker** (`src/components/MuscleRecoveryTracker.tsx`)
Recovery status and soreness input component.

**Props:**
- `onSave?: (data: RecoveryData) => void` - Callback when recovery data is saved
- `initialData?: RecoveryData` - Pre-filled recovery data

**Features:**
- Slider for soreness rating
- Status button selection
- Emoji feedback
- Automatic status determination

### 3. **MuscleVisualizerCard** (`src/components/MuscleVisualizerCard.tsx`)
Dashboard widget showing muscle metrics.

**Subcomponents:**
- `MuscleVisualizerCard` - Main card with stats
- `WeeklyMuscleHeatmap` - 7-day activity heatmap
- `MuscleProgressChart` - Volume distribution chart

### 4. **MuscleVisualizer Screen** (`app/muscles.tsx`)
Full-page screen with tabs for different views.

**Tabs:**
- **Visualizer**: 3D interactive body visualization
- **Recovery**: Soreness and recovery tracking
- **Analytics**: Detailed charts and statistics

## State Management

### Zustand Store: `useMuscleStore` (`src/store/useMuscleStore.ts`)

**State Properties:**
```typescript
interface MuscleVisualizerState {
    muscleData: Map<MuscleGroup, MuscleData>;
    selectedMuscle: MuscleGroup | null;
    viewMode: 'front' | 'back' | '3d';
    weeklyData: Map<MuscleGroup, number[]>;
    todaysExercises: Array<{...}>;
    isRotating: boolean;
    rotationX: number;
    rotationY: number;
    zoomLevel: number;
    highlightedMuscles: Set<MuscleGroup>;
}
```

**Actions:**
- `setMuscleData()` - Update muscle data
- `setSelectedMuscle()` - Change selected muscle
- `setViewMode()` - Switch view (front/back)
- `setRotation()` - Update 3D rotation
- `setZoomLevel()` - Change zoom level
- `resetVisualization()` - Reset all settings

## Services

### Muscle Calculation Service (`src/services/muscleCalculationService.ts`)

**Key Functions:**
- `getMuscleGroupsForExercise(name, category)` - Map exercise to muscle groups
- `calculateSetVolume(reps, weight, sets)` - Calculate volume for a set
- `getRecoveryStatus(soreness, daysSinceTrained)` - Determine recovery state
- `getMuscleColorByStatus(intensity, soreness)` - Get muscle color
- `buildMuscleDataFromWorkouts()` - Aggregate workout data into muscle metrics
- `calculateWeeklyData()` - Get 7-day volume data for a muscle

### Muscle Repository (`src/repositories/MuscleRepository.ts`)

**Key Methods:**
- `saveMuscleStats()` - Save muscle metrics to database
- `getMuscleStatsForDate()` - Get stats for specific date
- `getMuscleStatsForPeriod()` - Get stats for N days
- `saveMuscleRecovery()` - Save recovery data
- `getLatestRecoveryData()` - Get today's recovery data
- `getTodaysMuscleStats()` - Get aggregated today's stats
- `getWeeklyMuscleStats()` - Get weekly volume data

## Muscle Groups Supported

```typescript
type MuscleGroup =
    | 'Chest'
    | 'Back'
    | 'Shoulders'
    | 'Biceps'
    | 'Triceps'
    | 'Forearms'
    | 'Core'
    | 'Abs'
    | 'Quadriceps'
    | 'Hamstrings'
    | 'Glutes'
    | 'Calves';
```

## Exercise to Muscle Mapping

The system includes a comprehensive exercise-to-muscle mapping:

**Examples:**
- Bench Press → Chest
- Bent Over Row → Back + Biceps
- Deadlift → Back + Hamstrings + Glutes
- Squat → Quadriceps + Glutes + Hamstrings
- Shoulder Press → Shoulders
- Pull Up → Back + Biceps
- Dips → Triceps + Chest + Shoulders

[Full mapping in `muscleCalculationService.ts`]

## Data Flow

### Workout → Muscle Stats

1. User completes workout session
2. Workout sets are recorded with exercise, reps, weight
3. System maps exercises to muscle groups
4. Volume calculated: `volume = reps × weight × sets`
5. Stats saved to `muscle_stats` table
6. UI updated via store

### Recovery Tracking

1. User opens Recovery tab
2. Rates soreness for each muscle (0-10 scale)
3. Selects recovery status (optional, auto-determined)
4. Saves to `muscle_recovery` table
5. Data persists and influences future calculations

### Analytics Generation

1. System fetches stats from database
2. Aggregates volume by muscle group
3. Calculates intensity averages
4. Combines with recovery data
5. Generates visualizations

## Color Coding System

### Based on Intensity:
- **Purple** (#a855f7): High intensity (>7/10)
- **Cyan** (#06b6d4): Moderate intensity (4-7/10)
- **Green** (#10b981): Light intensity (1-3/10)
- **Slate Gray** (#64748b): No activity (0/10)

### Based on Soreness:
- **Red** (#ef4444): Very sore (>6/10)
- **Orange** (#f97316): Moderately sore (3-6/10)

**Priority**: Soreness takes precedence over intensity in color selection.

## Integration Points

### With Existing Features

1. **Workout Tracking**: Automatically calculates muscle engagement from completed workouts
2. **Dashboard**: Quick access widget showing today's muscle metrics
3. **User Profile**: Links to user's historical data

### Future Integration

1. **Health Connect**: Auto-sync soreness from wearables
2. **Notifications**: Recovery reminders
3. **Social**: Share muscle progress with friends
4. **AI Coach**: Personalized recommendations based on muscle recovery

## Usage Examples

### 1. View Today's Muscle Engagement
```typescript
import MuscleVisualizer from '@/components/MuscleVisualizer';
import useMuscleStore from '@/store/useMuscleStore';

const muscleData = useMuscleStore(state => state.muscleData);

<MuscleVisualizer 
    muscleData={muscleData}
    onMuscleSelect={(muscle) => console.log(`Selected: ${muscle}`)}
/>
```

### 2. Save Recovery Data
```typescript
import { MuscleRepository } from '@/repositories/MuscleRepository';

const handleRecoverySave = async (data) => {
    for (const [muscle, recovery] of Object.entries(data)) {
        await MuscleRepository.saveMuscleRecovery({
            userId: user.id,
            muscleGroup: muscle,
            date: today,
            soreness: recovery.soreness,
            recoveryStatus: recovery.recoveryStatus,
        });
    }
};
```

### 3. Get Weekly Analytics
```typescript
const weeklyData = await MuscleRepository.getWeeklyMuscleStats(userId);

weeklyData.forEach((volumes, muscle) => {
    console.log(`${muscle}: [${volumes.join(', ')}]`);
});
```

## Performance Considerations

1. **Data Aggregation**: Caches muscle calculations in Zustand store
2. **Database Queries**: Indexes on `(user_id, date)` for fast lookups
3. **Rendering**: Uses React Native's `memo` for muscle cards
4. **Storage**: Consider archiving stats older than 90 days

## Customization Guide

### Add New Muscle Group

1. Update `MuscleGroup` type in `useMuscleStore.ts`
2. Add SVG path in `MuscleVisualizer.tsx` for both front and back views
3. Update exercise mapping in `muscleCalculationService.ts`
4. Add color mapping if needed

### Change Color Scheme

Edit `getMuscleColorByStatus()` in:
- `muscleCalculationService.ts`
- `useMuscleStore.ts`

### Adjust Recovery Thresholds

Modify recovery status logic in:
- `getRecoveryStatus()` function in `muscleCalculationService.ts`
- `getRecoveryStatusFromSoreness()` in `MuscleRecoveryTracker.tsx`

## Testing Checklist

- [ ] Muscle visualization renders correctly
- [ ] Front/back view toggle works
- [ ] Muscle selection shows correct data
- [ ] Recovery tracker saves data
- [ ] Analytics load correctly
- [ ] Weekly heatmap displays properly
- [ ] Dashboard widget shows latest data
- [ ] Color coding matches intensity/soreness
- [ ] Database persists data correctly

## Troubleshooting

### Issue: No muscle data showing
- **Solution**: Ensure workout data exists in database before stats calculation

### Issue: Colors not updating
- **Solution**: Verify `getMuscleColor()` logic and data is loading from store

### Issue: Recovery data not saving
- **Solution**: Check database connection and user ID validation

### Issue: Performance issues with large datasets
- **Solution**: Implement pagination or limit to last 30 days of data

## Future Enhancements

1. **3D Model**: Upgrade to real 3D using Three.js or Babylon.js
2. **ML Insights**: Recommend rest days based on soreness patterns
3. **Sharing**: Share muscle engagement achievements
4. **Animations**: Muscle flex animations based on workout intensity
5. **Comparisons**: Compare muscle distribution with goals
6. **Predictions**: Predict recovery time based on historical data
7. **Integration**: Connect with nutrition tracking for muscle building

## API Reference

See individual component/service files for detailed JSDoc comments.

## License

Part of GymGuide360 application.
