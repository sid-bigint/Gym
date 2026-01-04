import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlobalTimer } from '../../src/components/GlobalTimer';
import { useTheme } from '../../src/store/useTheme';

export default function TabsLayout() {
    const { colors } = useTheme();

    return (
        <>
            <GlobalTimer />
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: colors.accent.primary,
                    tabBarInactiveTintColor: colors.text.tertiary,
                    tabBarStyle: {
                        backgroundColor: colors.background.secondary,
                        borderTopWidth: 1,
                        borderTopColor: colors.border.secondary,
                        height: 70,
                        paddingBottom: 10,
                        paddingTop: 10,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                    },
                    headerShown: false,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Dashboard',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="routines"
                    options={{
                        title: 'Routines',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="barbell-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="history"
                    options={{
                        title: 'Progress',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="analytics-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="nutrition"
                    options={{
                        title: 'Nutrition',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="restaurant-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person-outline" size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>
        </>
    );
}
