import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GlobalTimer } from '../../src/components/GlobalTimer';
import { useTheme } from '../../src/store/useTheme';
import { Platform } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();
const SwipeTabs = withLayoutContext(Navigator);

export default function TabsLayout() {
    const { colors } = useTheme();

    return (
        <>
            <GlobalTimer />
            <SwipeTabs
                tabBarPosition="bottom"
                screenOptions={{
                    tabBarActiveTintColor: colors.accent.primary,
                    tabBarInactiveTintColor: colors.text.tertiary,
                    tabBarStyle: {
                        backgroundColor: colors.background.secondary,
                        borderTopWidth: 1,
                        borderTopColor: colors.border.secondary,
                        height: Platform.OS === 'ios' ? 90 : 80,
                        paddingBottom: Platform.OS === 'ios' ? 25 : 15,
                        paddingTop: 5,
                    },
                    tabBarIndicatorStyle: {
                        backgroundColor: colors.accent.primary,
                        height: 3,
                        top: 0,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        textTransform: 'none',
                        margin: 0,
                        padding: 0,
                        marginTop: 2,
                    },
                    tabBarItemStyle: {
                        padding: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                    tabBarShowIcon: true,
                    swipeEnabled: true,
                }}
            >
                <SwipeTabs.Screen
                    name="index"
                    options={{
                        title: 'Dashboard',
                        tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
                        ),
                    }}
                />
                <SwipeTabs.Screen
                    name="routines"
                    options={{
                        title: 'Routines',
                        tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                            <Ionicons name={focused ? "barbell" : "barbell-outline"} size={26} color={color} />
                        ),
                    }}
                />
                <SwipeTabs.Screen
                    name="history"
                    options={{
                        title: 'Progress',
                        tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                            <Ionicons name={focused ? "analytics" : "analytics-outline"} size={26} color={color} />
                        ),
                    }}
                />
                <SwipeTabs.Screen
                    name="nutrition"
                    options={{
                        title: 'Nutrition',
                        tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                            <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={26} color={color} />
                        ),
                    }}
                />
                <SwipeTabs.Screen
                    name="settings"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                            <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
                        ),
                    }}
                />
            </SwipeTabs>
        </>
    );
}
