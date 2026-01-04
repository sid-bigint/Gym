import { Stack } from 'expo-router';
import { useTheme } from '../../src/store/useTheme';

export default function ProgramsLayout() {
    const { colors } = useTheme();

    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background.primary } }}>
            <Stack.Screen name="explore" />
            <Stack.Screen name="create" />
            <Stack.Screen name="details" options={{ presentation: 'card' }} />
        </Stack>
    );
}
