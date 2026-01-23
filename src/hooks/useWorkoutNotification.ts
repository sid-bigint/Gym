import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useWorkoutStore } from '../store/useWorkoutStore';

// Configure notifications to be silent but visible
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.LOW,
    }),
});

const MOTIVATIONAL_QUOTES = [
    "Pain is temporary. Glory is forever. 🏆",
    "Don't stop when you're tired. Stop when you're done. 💪",
    "Your only limit is you. 🚀",
    "Sweat is just fat crying. 💧",
    "Focus on your goals, not your fear. 🦁",
    "The body achieves what the mind believes. 🧠",
    "Push harder than yesterday if you want a different tomorrow. 🔥",
    "Discipline creates freedom. ⚓"
];

export function useWorkoutNotification() {
    const activeWorkout = useWorkoutStore(s => s.activeWorkout);
    const notificationId = useRef<string | null>(null);

    // Initial Setup
    useEffect(() => {
        async function setup() {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('workout-status', {
                    name: 'Active Workout Status',
                    importance: Notifications.AndroidImportance.LOW,
                    vibrationPattern: [0, 0, 0],
                    enableVibrate: false,
                    showBadge: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: undefined,
                });
            }
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') await Notifications.requestPermissionsAsync();
        }
        setup();
    }, []);

    // App State Listener - The Core Logic
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextStatus) => {
            if (nextStatus.match(/inactive|background/)) {
                // App is minimizing
                const currentWorkout = useWorkoutStore.getState().activeWorkout;
                if (currentWorkout) {
                    await scheduleStaticNotification(currentWorkout);
                }
            } else {
                // App is coming to foreground
                await dismissNotification();
            }
        });

        return () => {
            subscription.remove();
            dismissNotification();
        };
    }, []); // Run once on mount

    // Also listen for workout end to clean up if needed
    useEffect(() => {
        if (!activeWorkout) {
            dismissNotification();
        }
    }, [activeWorkout]);

    const scheduleStaticNotification = async (workout: any) => {
        // Dismiss any existing one first
        await dismissNotification();

        // Pick a random quote
        const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `⚡ Active Workout: ${workout.routineName || 'Training'}`,
                    body: quote,
                    data: { url: '/workout/active' },
                    priority: Notifications.AndroidNotificationPriority.LOW,
                    sticky: true, // User can't accidentally swipe it away
                    autoDismiss: false,
                    color: '#3B82F6', // Brand Blue
                    vibrate: undefined,
                    sound: false,
                },
                trigger: null, // Show immediately
            });
            notificationId.current = id;
        } catch (e) {
            console.log("Failed to schedule notification", e);
        }
    };

    const dismissNotification = async () => {
        if (notificationId.current) {
            await Notifications.dismissNotificationAsync(notificationId.current);
            notificationId.current = null;
        }
        // Safety: Only cancel ours if possible, but dismissAll is mostly safe for this app context
        // await Notifications.dismissAllNotificationsAsync(); 
    };
}
