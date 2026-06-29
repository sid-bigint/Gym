import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREF_KEY = '@reminders_enabled_v1';
const SCHEDULED_KEY = '@reminders_scheduled_date_v1';

// ─── Notification pools — motivational + meme energy ─────────────────────────

const MORNING: Array<{ title: string; body: string }> = [
    {
        title: '⚡ The alarm rang. So does opportunity.',
        body: "Your morning session is the one thing nobody can take from you today. Let's go.",
    },
    {
        title: '🔥 Champions don\'t hit snooze.',
        body: 'Every rep done before 9 AM is a rep your competition skipped. Make it count.',
    },
    {
        title: '🦁 The day belongs to those who start it.',
        body: 'Log your first meal. Plan your workout. Own today before it owns you.',
    },
    {
        title: '💀 Future you is already judging.',
        body: "The version of you that hits every goal? They started mornings like this. Don't let them down.",
    },
    {
        title: '😴 Bro really said "5 more minutes" 3 hours ago.',
        body: "The gym called. It wants to know if you're coming or just paying the membership fee.",
    },
    {
        title: '🐔 Your chicken is already cooked. Are you?',
        body: "Meal prep is done. Gym bag is packed. Your excuses are the only thing not ready.",
    },
    {
        title: '📱 You checked Instagram before logging breakfast.',
        body: "Open this app instead. Your macros won't track themselves while you scroll.",
    },
    {
        title: '☕ Coffee is not a meal. Log your breakfast.',
        body: "We know you had coffee. Your body needs more than vibes and caffeine to build muscle.",
    },
];

const MIDDAY: Array<{ title: string; body: string }> = [
    {
        title: '🍗 You ate. Now prove it.',
        body: "Untracked calories count just as much as tracked ones. 10 seconds. Log it now.",
    },
    {
        title: '📊 Your macros are a mystery right now.',
        body: 'Close the gap. Log your lunch before the details get fuzzy.',
    },
    {
        title: '🔬 Data doesn\'t lie. Missing logs do.',
        body: "You can't hit a target you're not measuring. Tap to log what you just ate.",
    },
    {
        title: '🥗 Quick — what did lunch look like?',
        body: "Log it now while it's fresh. Don't guess at the end of the day.",
    },
    {
        title: '🍕 We\'re not judging what you ate. Just log it.',
        body: "Pizza? Log it. Biriyani? Log it. Empty bowl of sadness? Also log it. No judgment here.",
    },
    {
        title: '🤔 "It was just a small snack bro."',
        body: "Those 'small snacks' are playing chess while you're playing checkers. Log them.",
    },
    {
        title: '🍱 The office lunch was suspicious but log it anyway.',
        body: "Best guess is better than no guess. Estimate and move on. Your streak depends on it.",
    },
    {
        title: '💀 Skipping lunch logging is a war crime here.',
        body: "We don't make the rules. Actually we do. Log your meals. That's the rule.",
    },
];

const AFTERNOON: Array<{ title: string; body: string }> = [
    {
        title: '⚡ Halfway through the day. How\'s your nutrition?',
        body: 'Check your macros, log your snack, and stay on track. One tap away.',
    },
    {
        title: '🔋 Feeling the 3 PM crash?',
        body: "Your body's asking for fuel. Log what you've eaten — maybe your protein's low.",
    },
    {
        title: '🎯 Afternoon check-in.',
        body: 'Meals logged: ? • Workout logged: ? • Don\'t let today slip by untracked.',
    },
    {
        title: '💧 Nutrition is 70% of the result.',
        body: "You can't out-train an untracked diet. Stay consistent — log your snack.",
    },
    {
        title: '🍫 We know about the chocolate. Log it.',
        body: "That sneaky 3 PM snack has been living rent-free in your untracked calories. Evict it.",
    },
    {
        title: '😤 Your protein is probably low. It always is.',
        body: "Log your meals and check. Surprise: you need more chicken. You always need more chicken.",
    },
    {
        title: '🧠 Big brain move: log now, not at 11 PM.',
        body: "Night-logging from memory is how you accidentally eat 4000 calories on paper. Do it now.",
    },
    {
        title: '🏋️ Pre-workout without a workout is just anxiety.',
        body: "You took pre-workout at 2 PM. Now channel that energy — log your meals and plan tonight's session.",
    },
];

const EVENING: Array<{ title: string; body: string }> = [
    {
        title: '🏆 Evening session? The window is open.',
        body: 'The gym is less crowded than your regrets will be if you skip. 45 min. That\'s all.',
    },
    {
        title: '💪 One workout from a better mood.',
        body: "Science confirms it. Your routine is waiting. Don't break the streak.",
    },
    {
        title: '🚀 Last chance for today\'s session.',
        body: "Tomorrow's you will be built by what tonight's you decides. Show up.",
    },
    {
        title: '🔥 Your streak doesn\'t care about your energy levels.',
        body: "Neither does your competition. Log your workout or at least your meals. Stay consistent.",
    },
    {
        title: '🛋️ "I\'ll go tomorrow." — you, yesterday.',
        body: "Tomorrow you is fed up with today you's excuses. Get to the gym. 40 minutes. Go.",
    },
    {
        title: '😤 The only bad workout is the one that didn\'t happen.',
        body: "Even a lazy session beats zero. Show up, do something, log it. That's the game.",
    },
    {
        title: '🎧 Plug in. Tune out. Lift heavy.',
        body: "Your playlist is ready. Your muscles are ready. Your pre-workout is NOT optional. Go.",
    },
    {
        title: '📸 You want the results but not the reps.',
        body: "Everyone wants to look like they gym. Only some actually do. Be in that group.",
    },
];

const NIGHT: Array<{ title: string; body: string }> = [
    {
        title: '🌙 Before you sleep — close the loop.',
        body: "30 seconds to log dinner and lock in today's data. Tomorrow's results start now.",
    },
    {
        title: '📝 End of day. Did today count?',
        body: "Your streak lives if you log. One entry. That's it. Tap to finish strong.",
    },
    {
        title: '🔥 Don\'t let today go unrecorded.',
        body: 'Every meal, every rep — log it. Your future self reads this data like a scoreboard.',
    },
    {
        title: '⭐ You made it to tonight. Prove it.',
        body: "Log your final meal. Check your macros. Sleep knowing today was tracked.",
    },
    {
        title: '🛌 Logging dinner takes less time than this notification.',
        body: "You've already read this far. Just open the app and log. You're basically done.",
    },
    {
        title: '😴 Your gains are made while you sleep. But first — log.',
        body: "Protein synthesis happens overnight. Make sure the data supports it. Log your dinner.",
    },
    {
        title: '🌚 It\'s late. You\'re tired. Log anyway.',
        body: "Future you at 6 AM thanks you for every entry you logged at 9 PM. Seriously.",
    },
    {
        title: '🍜 Late-night snack? We won\'t judge. Just log it.',
        body: "Those midnight noodles count. Log them. The macros don't care what time it is.",
    },
];

// Streak-specific (scheduled separately when streak is at risk)
export const STREAK_SAVER = {
    title: '🔥 Your streak is about to die. Don\'t let it.',
    body: "You've built something real. One log is all it takes to keep it alive. Don't be the villain of your own story.",
};

// ─── Slot config: [hour, minute, pool, identifier, channelId] ────────────────
type Slot = {
    id: string;
    hour: number;
    minute: number;
    pool: Array<{ title: string; body: string }>;
    channelId: string;
    color: string;
};

const SLOTS: Slot[] = [
    { id: 'morning',   hour: 7,  minute: 30, pool: MORNING,   channelId: 'fitness-reminders', color: '#F59E0B' },
    { id: 'midday',    hour: 12, minute: 15, pool: MIDDAY,    channelId: 'meal-reminders',    color: '#10B981' },
    { id: 'afternoon', hour: 15, minute: 0,  pool: AFTERNOON, channelId: 'meal-reminders',    color: '#10B981' },
    { id: 'evening',   hour: 18, minute: 30, pool: EVENING,   channelId: 'fitness-reminders', color: '#3B82F6' },
    { id: 'night',     hour: 21, minute: 0,  pool: NIGHT,     channelId: 'meal-reminders',    color: '#8B5CF6' },
];

// ─── Android channel setup ────────────────────────────────────────────────────
async function setupChannels() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('fitness-reminders', {
        name: 'Workout Reminders',
        description: 'Daily workout motivation and training reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        enableVibrate: true,
        enableLights: true,
        lightColor: '#3B82F6',
        showBadge: true,
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync('meal-reminders', {
        name: 'Meal & Nutrition Reminders',
        description: 'Reminders to log your meals and track macros',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200, 100, 200],
        enableVibrate: true,
        enableLights: true,
        lightColor: '#10B981',
        showBadge: true,
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync('streak-alerts', {
        name: 'Streak Alerts',
        description: 'Urgent alerts when your streak is at risk',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 300, 500, 300, 500],
        enableVibrate: true,
        enableLights: true,
        lightColor: '#EF4444',
        showBadge: true,
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
}

// ─── Action categories ────────────────────────────────────────────────────────
async function setupCategories() {
    await Notifications.setNotificationCategoryAsync('workout_reminder', [
        {
            identifier: 'open_workout',
            buttonTitle: '💪 Start Workout',
            options: { opensAppToForeground: true },
        },
        {
            identifier: 'log_meal',
            buttonTitle: '🍽️ Log Meal',
            options: { opensAppToForeground: true },
        },
    ]);

    await Notifications.setNotificationCategoryAsync('meal_reminder', [
        {
            identifier: 'log_meal',
            buttonTitle: '✅ Log Now',
            options: { opensAppToForeground: true },
        },
        {
            identifier: 'snooze',
            buttonTitle: '⏰ 30 min',
            options: { opensAppToForeground: false },
        },
    ]);

    await Notifications.setNotificationCategoryAsync('streak_alert', [
        {
            identifier: 'log_now',
            buttonTitle: '🔥 Save Streak',
            options: { opensAppToForeground: true },
        },
    ]);
}

// ─── Core scheduling ──────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function cancelAll() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
        if (
            n.identifier.startsWith('daily_') ||
            n.identifier.startsWith('streak_')
        ) {
            await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
    }
}

async function scheduleAll() {
    for (const slot of SLOTS) {
        const msg = pickRandom(slot.pool);
        const isMeal = slot.channelId === 'meal-reminders';

        await Notifications.scheduleNotificationAsync({
            identifier: `daily_${slot.id}`,
            content: {
                title: msg.title,
                body: msg.body,
                color: slot.color,
                sound: 'default',
                categoryIdentifier: isMeal ? 'meal_reminder' : 'workout_reminder',
                data: { slot: slot.id },
                ...(Platform.OS === 'android' && { channelId: slot.channelId }),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: slot.hour,
                minute: slot.minute,
                repeats: true,
            },
        });
    }
}

// ─── Streak-saver: fires at 8 PM if not yet called today ─────────────────────

export async function scheduleStreakSaverIfNeeded() {
    const enabled = await isEnabled();
    if (!enabled) return;

    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const alreadySet = existing.some(n => n.identifier === 'streak_saver_tonight');
    if (alreadySet) return;

    const now = new Date();
    const fireAt = new Date(now);
    fireAt.setHours(20, 0, 0, 0);
    if (fireAt <= now) return; // already past 8 PM

    await Notifications.scheduleNotificationAsync({
        identifier: 'streak_saver_tonight',
        content: {
            title: STREAK_SAVER.title,
            body: STREAK_SAVER.body,
            color: '#EF4444',
            sound: 'default',
            categoryIdentifier: 'streak_alert',
            ...(Platform.OS === 'android' && { channelId: 'streak-alerts' }),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireAt,
        },
    });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function isEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(PREF_KEY);
    return val !== 'false'; // default ON
}

export async function setEnabled(enabled: boolean) {
    await AsyncStorage.setItem(PREF_KEY, enabled ? 'true' : 'false');
    if (enabled) {
        await init(true);
    } else {
        await cancelAll();
    }
}

export async function init(force = false) {
    const enabled = await isEnabled();
    if (!enabled) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') return;
    }

    await setupChannels();
    await setupCategories();

    // Only reschedule once per day (or when forced)
    const today = new Date().toDateString();
    const lastScheduled = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (!force && lastScheduled === today) return;

    await cancelAll();
    await scheduleAll();
    await AsyncStorage.setItem(SCHEDULED_KEY, today);
}
