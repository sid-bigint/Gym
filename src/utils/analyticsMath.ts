import { format, subDays, isSameDay } from 'date-fns';

export function buildWorkoutChartData(workouts: any[]) {
    if (workouts.length === 0) return null;
    const last7 = [...workouts].reverse().slice(-7);
    return {
        labels: last7.map(w => format(new Date(w.date), 'MM/dd')),
        datasets: [{ data: last7.map(w => (w.volume || 0) / 1000) }],
    };
}

export function buildNutritionCharts(nutritionHistory: any[]) {
    const labels = Array.from({ length: 7 }, (_, i) =>
        format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    );
    const caloriesData = labels.map(day => {
        const entry = nutritionHistory.find(n => n.date === day);
        return entry ? entry.calories || 0 : 0;
    });
    const proteinData = labels.map(day => {
        const entry = nutritionHistory.find(n => n.date === day);
        return entry ? entry.protein || 0 : 0;
    });
    const displayLabels = labels.map(l => format(new Date(l), 'MM/dd'));
    return {
        calories: { labels: displayLabels, datasets: [{ data: caloriesData }] },
        protein: { labels: displayLabels, datasets: [{ data: proteinData }] },
    };
}

export function buildBodyCharts(measurements: any[]) {
    const labels = Array.from({ length: 7 }, (_, i) =>
        format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    );
    const weightData = labels.map(day => {
        const exact = measurements.find(m => isSameDay(new Date(m.date), new Date(day)));
        if (exact) return exact.weight;
        const prev = [...measurements]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .find(m => new Date(m.date).getTime() < new Date(day).getTime());
        return prev ? prev.weight : (measurements[0]?.weight || 0);
    });
    return {
        weight: {
            labels: labels.map(l => format(new Date(l), 'MM/dd')),
            datasets: [{ data: weightData }],
        },
        hasValidData: weightData.some(v => v > 0),
    };
}

export function buildWorkoutStats(workouts: any[], nutritionHistory: any[], measurements: any[]) {
    const totalVolume = workouts.reduce((acc, w) => acc + (w.volume || 0), 0);
    const totalDuration = workouts.reduce((acc, w) => acc + (w.duration || 0), 0);
    const totalSets = workouts.reduce((acc, w) => acc + (w.setsCount || 0), 0);
    const exerciseNames = new Set<string>();
    workouts.forEach(w => w.exercises?.forEach((name: string) => exerciseNames.add(name)));
    const avgCalories = nutritionHistory.length > 0
        ? (nutritionHistory.reduce((acc, n) => acc + (n.calories || 0), 0) / nutritionHistory.length).toFixed(0)
        : '0';
    const avgProtein = nutritionHistory.length > 0
        ? (nutritionHistory.reduce((acc, n) => acc + (n.protein || 0), 0) / nutritionHistory.length).toFixed(1)
        : '0';
    const currentWeight = measurements[0]?.weight || 0;
    const prevWeight = measurements[1]?.weight || currentWeight;
    return {
        totalWorkouts: workouts.length,
        avgDuration: workouts.length > 0 ? (totalDuration / workouts.length).toFixed(0) : '0',
        totalVolume: (totalVolume / 1000).toFixed(1),
        totalSets,
        uniqueExercises: exerciseNames.size,
        avgCalories,
        avgProtein,
        currentWeight,
        weightChange: (currentWeight - prevWeight).toFixed(1),
    };
}

export function buildTrainingAnalytics(workouts: any[]) {
    const chronological = [...workouts].reverse();
    const bestByExercise = new Map<string, any>();
    let bestSessionVolume = 0;
    let bestSession: any = null;
    const prEvents: any[] = [];
    const workoutPrMap: Record<number, any[]> = {};

    chronological.forEach(workout => {
        if ((workout.volume || 0) > bestSessionVolume) {
            if (bestSessionVolume > 0) {
                const event = {
                    workoutId: workout.id,
                    type: 'Session Volume PR',
                    label: `${((workout.volume || 0) / 1000).toFixed(1)}k kg`,
                    icon: 'trophy-outline',
                };
                prEvents.push(event);
                workoutPrMap[workout.id] = [...(workoutPrMap[workout.id] || []), event];
            }
            bestSessionVolume = workout.volume || 0;
            bestSession = workout;
        }

        (workout.exerciseSummaries || []).forEach((summary: any) => {
            const previous = bestByExercise.get(summary.name);
            const events: any[] = [];
            if (previous) {
                if (summary.bestWeight > previous.bestWeight) {
                    events.push({ workoutId: workout.id, type: 'Weight PR', exercise: summary.name, label: `${summary.bestWeight}kg x ${summary.bestReps}`, icon: 'barbell-outline' });
                }
                if (summary.bestEstimatedOneRepMax > previous.bestEstimatedOneRepMax) {
                    events.push({ workoutId: workout.id, type: 'Estimated 1RM PR', exercise: summary.name, label: `${summary.bestEstimatedOneRepMax}kg`, icon: 'flash-outline' });
                }
                if (summary.volume > previous.volume) {
                    events.push({ workoutId: workout.id, type: 'Volume PR', exercise: summary.name, label: `${Math.round(summary.volume)}kg`, icon: 'stats-chart-outline' });
                }
            }
            bestByExercise.set(summary.name, {
                bestWeight: Math.max(previous?.bestWeight || 0, summary.bestWeight || 0),
                bestEstimatedOneRepMax: Math.max(previous?.bestEstimatedOneRepMax || 0, summary.bestEstimatedOneRepMax || 0),
                volume: Math.max(previous?.volume || 0, summary.volume || 0),
                sets: Math.max(previous?.sets || 0, summary.sets || 0),
            });
            if (events.length > 0) {
                prEvents.push(...events);
                workoutPrMap[workout.id] = [...(workoutPrMap[workout.id] || []), ...events];
            }
        });
    });

    const topExercises = Array.from(bestByExercise.entries())
        .map(([name, best]) => ({ name, ...best }))
        .sort((a, b) => (b.volume || 0) - (a.volume || 0))
        .slice(0, 6);

    return {
        bestSession,
        bestSessionVolume,
        topExercises,
        recentPrs: prEvents.slice(-8).reverse(),
        workoutPrMap,
    };
}
