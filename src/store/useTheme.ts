import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { getThemeColors, ThemeMode, ThemeType } from '../constants/theme';

interface ThemeState {
    mode: ThemeMode;
    themeType: ThemeType;
    colorScheme: 'light' | 'dark';
    colors: ReturnType<typeof getThemeColors>;
    setThemeMode: (mode: ThemeMode) => void;
    setThemeType: (type: ThemeType) => void;
    initTheme: () => void;
}

const getEffectiveColorScheme = (mode: ThemeMode, systemScheme: ColorSchemeName): 'light' | 'dark' => {
    if (mode === 'system') {
        return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return mode;
};

export const useTheme = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'system', // Default to system settings
            themeType: 'blue', // Default to Blue instead of Purple
            colorScheme: 'light', // Initial placeholder
            colors: getThemeColors('light', 'blue'), // Initial placeholder

            setThemeMode: (mode: ThemeMode) => {
                const systemScheme = Appearance.getColorScheme();
                const effectiveScheme = getEffectiveColorScheme(mode, systemScheme);
                const type = get().themeType;

                set({
                    mode,
                    colorScheme: effectiveScheme,
                    colors: getThemeColors(effectiveScheme, type),
                });
            },

            setThemeType: (type: ThemeType) => {
                const scheme = get().colorScheme;
                set({
                    themeType: type,
                    colors: getThemeColors(scheme, type),
                });
            },

            initTheme: () => {
                const systemScheme = Appearance.getColorScheme();
                const mode = get().mode;
                const type = get().themeType;
                const effectiveScheme = getEffectiveColorScheme(mode, systemScheme);

                set({
                    colorScheme: effectiveScheme,
                    colors: getThemeColors(effectiveScheme, type),
                });

                // Clear previous listeners to avoid duplicates if re-initialized (though init usually runs once)
                // In generic React Native, we can't easily "remove" without storing the subscription, 
                // but since this is a global store, we can just add it once.
                // However, simpler is just to ensure we handle updates.
                const subscription = Appearance.addChangeListener(({ colorScheme }) => {
                    const currentMode = get().mode;
                    const currentType = get().themeType;
                    if (currentMode === 'system') {
                        const newScheme = colorScheme === 'dark' ? 'dark' : 'light';
                        set({
                            colorScheme: newScheme,
                            colors: getThemeColors(newScheme, currentType),
                        });
                    }
                });
            },
        }),
        {
            name: 'gym-app-theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ mode: state.mode, themeType: state.themeType } as any),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.initTheme();
                }
            },
        }
    )
);
