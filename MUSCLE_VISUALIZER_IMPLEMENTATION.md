# Muscle Visualizer - Implementation Guide

## Quick Start

This guide walks you through integrating the muscle visualizer into your existing Gym app.

## Step 1: Database Setup

The schema has already been extended in `src/db/schema.ts` with two new tables:
- `muscle_stats` - Stores workout volume metrics per muscle
- `muscle_recovery` - Tracks soreness and recovery status

**Action needed**: Run your database migrations to create these tables.

```bash
# If using Drizzle ORM migrations
npm run db:push  # or your migration command
```

## Step 2: Install Required Dependencies

Check that you have these in your `package.json`:

```json
{
  "dependencies": {
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-svg": "^13.0.0"
  }
}
```

If missing, install:
```bash
npm install react-native-svg react-native-gesture-handler react-native-reanimated
```

## Step 3: Add Route to Navigation

Add the muscle visualizer to your app's main navigation. Update your `app/(tabs)/_layout.tsx` or navigation setup:

```typescript
// app/(tabs)/_layout.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <BottomTabNavigator>
      {/* ... existing tabs ... */}
      
      <BottomTabNavigator.Screen
        name="muscles"
        options={{
          title: 'Muscles',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="arm-flex" size={24} color={color} />
          ),
        }}
      />
    </BottomTabNavigator>
  );
}
```

## Step 4: Wire Up Workout Data

Update your workout completion logic to calculate and save muscle stats.

**In your workout service** (e.g., `src/services/workoutCompletionService.ts`):

```typescript
import MuscleRepository from '@/repositories/MuscleRepository';
import { getMuscleGroupsForExercise, calculateSetVolume } from '@/services/muscleCalculationService';

export async function completeWorkout(workoutSession: WorkoutSession, sets: WorkoutSet[]) {
    const userId = useAuthStore.getState().userId;
    const today = new Date().toISOString().split('T')[0];

    // Your existing workout completion logic...

    // NEW: Calculate and save muscle stats
    const muscleStats: MuscleStatsInput[] = [];

    for (const set of sets) {
        const exerciseName = set.exerciseName;
        const muscles = getMuscleGroupsForExercise(exerciseName);
        const volume = calculateSetVolume(set.reps, set.weight);

        for (const muscle of muscles) {
            muscleStats.push({
                userId,
                muscleGroup: muscle,
                date: today,
                volume,
                setCount: 1,
                repCount: set.reps,
                intensity: Math.min(10, volume / 50), // Normalize intensity
            });
        }
    }

    // Save all stats
    await MuscleRepository.saveMuscleStatsBatch(muscleStats);

    // Update UI store
    const todayStats = await MuscleRepository.getTodaysMuscleStats(userId);
    useMuscleStore.getState().setMuscleData(todayStats);
}
```

## Step 5: Add Dashboard Widget (Optional)

Add the muscle metrics card to your home dashboard:

```typescript
// app/(tabs)/index.tsx (or your dashboard)
import { MuscleVisualizerCard } from '@/components/MuscleVisualizerCard';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
    const router = useRouter();
    const muscleData = useMuscleStore(state => state.muscleData);

    return (
        <ScrollView>
            {/* ... existing dashboard content ... */}

            <MuscleVisualizerCard
                muscleData={muscleData}
                onPress={() => router.push('/muscles')}
            />
        </ScrollView>
    );
}
```

## Step 6: Initialize Store on App Launch

Ensure muscle data loads when user logs in:

```typescript
// src/services/authService.ts or your auth setup

export async function handleUserLogin(userId: number) {
    // Your existing login logic...

    // NEW: Load muscle data
    const todayStats = await MuscleRepository.getTodaysMuscleStats(userId);
    useMuscleStore.getState().setMuscleData(todayStats);

    const weeklyStats = await MuscleRepository.getWeeklyMuscleStats(userId);
    useMuscleStore.getState().setWeeklyData(weeklyStats);
}
```

## Step 7: Update Exercise Database

Ensure all exercises in your `exerciseData.json` have a `category` field that maps to muscle groups:

```json
{
  "exercises": [
    {
      "name": "Bench Press",
      "category": "Chest",
      "type": "Gym",
      ...
    },
    {
      "name": "Bent Over Row",
      "category": "Back",
      "type": "Gym",
      ...
    }
  ]
}
```

The system uses the `exerciseMuscleMap` in `muscleCalculationService.ts` for mapping. If your exercises don't match, add them:

```typescript
// In src/services/muscleCalculationService.ts
const exerciseMuscleMap: Record<string, MuscleGroup[]> = {
    'your exercise name': ['Muscle1', 'Muscle2'],
    // ... add more
};
```

## Component Integration Examples

### Add to Custom Page
```typescript
import MuscleVisualizer from '@/components/MuscleVisualizer';
import useMuscleStore from '@/store/useMuscleStore';

export default function MyPage() {
    const muscleData = useMuscleStore(state => state.muscleData);
    
    return (
        <MuscleVisualizer 
            muscleData={muscleData}
            onMuscleSelect={(muscle) => {
                console.log('Selected:', muscle);
            }}
        />
    );
}
```

### Add to Workout Summary
```typescript
import { MuscleProgressChart } from '@/components/MuscleVisualizerCard';

export default function WorkoutSummary() {
    const muscleData = useMuscleStore(state => state.muscleData);
    
    return (
        <ScrollView>
            {/* Existing summary... */}
            <MuscleProgressChart muscleData={muscleData} />
        </ScrollView>
    );
}
```

## Testing the Integration

### Test 1: Complete a Workout
1. Navigate to create a new workout
2. Add exercises with sets/reps/weight
3. Mark workout as complete
4. Check if muscle stats were saved to database

### Test 2: View Muscle Visualizer
1. Navigate to Muscles tab
2. Should see visualization with colors
3. Tap on a muscle to see details
4. Toggle between front/back views

### Test 3: Track Recovery
1. On Recovery tab, adjust soreness levels
2. Save recovery data
3. Refresh to see colors updated based on soreness

### Test 4: Analytics
1. Complete multiple workouts throughout the week
2. Check Analytics tab
3. Should see heatmap and progress charts

## Troubleshooting

### Issue: "Cannot find module muscleCalculationService"
**Solution**: Ensure all service files are created in `src/services/`

### Issue: Muscle data not showing colors
**Solution**: Check that workout data is being saved and `getMuscleColor()` is being called

### Issue: Recovery data not persisting
**Solution**: Verify database connection with `MuscleRepository` methods

### Issue: Components not displaying properly
**Solution**: Check React Native version compatibility, ensure `react-native-svg` is installed

## Database Queries

### View today's muscle stats
```sql
SELECT * FROM muscle_stats 
WHERE user_id = ? AND date = DATE('now')
ORDER BY volume DESC;
```

### View weekly recovery data
```sql
SELECT * FROM muscle_recovery 
WHERE user_id = ? AND date >= DATE('now', '-7 days')
ORDER BY date DESC, muscle_group;
```

### Get most sore muscle
```sql
SELECT muscle_group, MAX(soreness) as max_soreness
FROM muscle_recovery
WHERE user_id = ? AND date = DATE('now')
GROUP BY muscle_group
ORDER BY max_soreness DESC
LIMIT 1;
```

## Performance Tips

1. **Limit historical data**: Archive stats older than 90 days
2. **Batch operations**: Use `saveMuscleStatsBatch()` instead of individual saves
3. **Lazy load analytics**: Don't load heatmap until user navigates to Analytics tab
4. **Cache muscle data**: Store in Zustand and refresh on app resume

## Customization

### Change Color Scheme
Edit `getMuscleColorByStatus()` in `muscleCalculationService.ts`

### Add New Muscle Group
1. Add to `MuscleGroup` type
2. Add SVG paths to `MuscleVisualizer`
3. Update exercise mapping

### Adjust Soreness Threshold
Modify the recovery status logic in `getRecoveryStatus()` function

## Next Steps

1. ✅ Database setup
2. ✅ Component integration
3. ✅ Workout data wiring
4. ✅ Dashboard widget
5. Consider: Health Connect integration for automatic soreness detection
6. Consider: Machine learning for recovery recommendations
7. Consider: Share achievements with friends

## Support Files Created

- [x] `src/db/schema.ts` - Updated with muscle tracking tables
- [x] `src/store/useMuscleStore.ts` - Zustand store for muscle state
- [x] `src/services/muscleCalculationService.ts` - Volume/intensity calculations
- [x] `src/components/MuscleVisualizer.tsx` - 3D muscle visualization
- [x] `src/components/MuscleRecoveryTracker.tsx` - Recovery tracking UI
- [x] `src/components/MuscleVisualizerCard.tsx` - Dashboard widget
- [x] `src/repositories/MuscleRepository.ts` - Database operations
- [x] `app/muscles.tsx` - Full muscle visualizer page
- [x] `MUSCLE_VISUALIZER_DOCUMENTATION.md` - Complete documentation

## Questions?

Refer to the individual component files for detailed JSDoc documentation on each function and component.
