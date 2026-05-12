import { create } from 'zustand';

export type MuscleGroup =
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

export type RecoveryStatus = 'FRESH' | 'FATIGUED' | 'SORE' | 'RECOVERING';

export interface MuscleData {
    group: MuscleGroup;
    volume: number; // Total volume (sets × reps × weight)
    setCount: number;
    repCount: number;
    intensity: number; // 1-10 scale
    soreness: number; // 0-10 scale
    recoveryStatus: RecoveryStatus;
    lastTrainedDate: string | null;
    restDaysSince: number;
    color: string; // Color for visualization
}

export interface MuscleVisualizerState {
    // Data
    muscleData: Map<MuscleGroup, MuscleData>;
    selectedMuscle: MuscleGroup | null;
    viewMode: 'front' | 'back' | '3d';
    weeklyData: Map<MuscleGroup, number[]>; // 7 days of volume data
    todaysExercises: Array<{ muscleGroup: MuscleGroup; exerciseName: string; volume: number }>;

    // Animations & Interactions
    isRotating: boolean;
    rotationX: number;
    rotationY: number;
    zoomLevel: number;
    highlightedMuscles: Set<MuscleGroup>;

    // Setters
    setMuscleData: (data: Map<MuscleGroup, MuscleData>) => void;
    setSelectedMuscle: (muscle: MuscleGroup | null) => void;
    setViewMode: (mode: 'front' | 'back' | '3d') => void;
    setIsRotating: (rotating: boolean) => void;
    setRotation: (x: number, y: number) => void;
    setZoomLevel: (zoom: number) => void;
    setHighlightedMuscles: (muscles: Set<MuscleGroup>) => void;
    setTodaysExercises: (exercises: Array<{ muscleGroup: MuscleGroup; exerciseName: string; volume: number }>) => void;
    setWeeklyData: (data: Map<MuscleGroup, number[]>) => void;

    // Utils
    getMuscleColor: (muscle: MuscleGroup, intensity: number, soreness: number) => string;
    resetVisualization: () => void;
}

const getMuscleColor = (muscle: MuscleGroup, intensity: number, soreness: number): string => {
    // Priority 1: High Soreness (Injury/Overtraining Warning)
    if (soreness > 7) return '#f87171'; // Bright Coral Red
    if (soreness > 4) return '#fb923c'; // Warning Orange

    // Priority 2: Intensity (Workout Volume/Effort)
    if (intensity >= 9) return '#8b5cf6'; // Heavy: Electric Purple
    if (intensity >= 7) return '#4f46e5'; // High: Indigo
    if (intensity >= 4) return '#2563eb'; // Moderate: Royal Blue
    if (intensity >= 1) return '#10b981'; // Light: Emerald Green

    // Default: Inactive/Fresh
    return '#1e293b'; // Deep Slate (fits premium dark theme)
};

const useMuscleStore = create<MuscleVisualizerState>((set) => ({
    // Initial state
    muscleData: new Map(),
    selectedMuscle: null,
    viewMode: 'front',
    weeklyData: new Map(),
    todaysExercises: [],
    isRotating: false,
    rotationX: 0,
    rotationY: 0,
    zoomLevel: 1,
    highlightedMuscles: new Set(),

    // Setters
    setMuscleData: (data) => set({ muscleData: data }),
    setSelectedMuscle: (muscle) => set({ selectedMuscle: muscle }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setIsRotating: (rotating) => set({ isRotating: rotating }),
    setRotation: (x, y) => set({ rotationX: x, rotationY: y }),
    setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.5, Math.min(3, zoom)) }),
    setHighlightedMuscles: (muscles) => set({ highlightedMuscles: muscles }),
    setTodaysExercises: (exercises) => set({ todaysExercises: exercises }),
    setWeeklyData: (data) => set({ weeklyData: data }),

    // Utility function
    getMuscleColor,

    // Reset
    resetVisualization: () =>
        set({
            selectedMuscle: null,
            viewMode: 'front',
            isRotating: false,
            rotationX: 0,
            rotationY: 0,
            zoomLevel: 1,
            highlightedMuscles: new Set(),
        }),
}));

export default useMuscleStore;
