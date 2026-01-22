import { useWorkoutStore } from './useWorkoutStore';
import { Platform, StatusBar } from 'react-native';

/**
 * Hook to get the top padding required for screens based on whether 
 * there's an active workout (GlobalTimer is visible)
 */
export function useScreenPadding() {
    const { activeWorkout } = useWorkoutStore();

    // Base safe area padding
    const basePadding = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 4;

    // If there's an active workout, add extra padding for the GlobalTimer
    // GlobalTimer is approximately 54px tall (10px padding top/bottom + ~34px content)
    const timerHeight = 54;

    return {
        safeTop: basePadding,
        contentTop: activeWorkout ? basePadding + timerHeight + 8 : basePadding,
        hasActiveWorkout: !!activeWorkout,
    };
}
