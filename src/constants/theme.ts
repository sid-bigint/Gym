// Theme system with light and dark modes
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeType = 'purple' | 'blue' | 'green' | 'red' | 'pink' | 'yellow' | 'black' | 'orange' | 'teal' | 'cyan' | 'rose';

export const accentColors = {
    purple: { primary: '#8B5CF6', secondary: '#A78BFA', tertiary: '#C4B5FD' },
    blue: { primary: '#3B82F6', secondary: '#60A5FA', tertiary: '#93C5FD' },
    green: { primary: '#10B981', secondary: '#34D399', tertiary: '#6EE7B7' },
    red: { primary: '#EF4444', secondary: '#F87171', tertiary: '#FCA5A5' },
    pink: { primary: '#EC4899', secondary: '#F472B6', tertiary: '#F9A8D4' },
    yellow: { primary: '#F59E0B', secondary: '#FBBF24', tertiary: '#FDE68A' },
    black: { primary: '#334155', secondary: '#475569', tertiary: '#64748B' },
    orange: { primary: '#F97316', secondary: '#FB923C', tertiary: '#FDBA74' },
    teal: { primary: '#14B8A6', secondary: '#2DD4BF', tertiary: '#5EEAD4' },
    cyan: { primary: '#06B6D4', secondary: '#22D3EE', tertiary: '#67E8F9' },
    rose: { primary: '#F43F5E', secondary: '#FB7185', tertiary: '#FDA4AF' },
};

export const getThemeColors = (mode: 'light' | 'dark', type: ThemeType = 'purple') => {
    const accent = accentColors[type];

    if (mode === 'light') {
        return {
            background: {
                primary: '#FFFFFF',
                secondary: '#F5F5F7',
                card: '#FFFFFF',
                elevated: '#F9F9FB',
            },
            accent: {
                ...accent,
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
            },
            text: {
                primary: '#1F2937',
                secondary: '#4B5563',
                tertiary: '#6B7280',
                disabled: '#9CA3AF',
                inverse: '#FFFFFF',
            },
            border: {
                primary: '#E5E7EB',
                secondary: '#F3F4F6',
                accent: accent.primary,
            },
            status: {
                active: accent.primary,
                inactive: '#9CA3AF',
                completed: '#10B981',
                error: '#EF4444',
            },
            nutrition: {
                protein: accent.primary,
                carbs: '#F59E0B',
                fats: '#10B981',
                calories: accent.secondary,
            },
        };
    }

    return {
        background: {
            primary: type === 'black' ? '#000000' : '#000000', // Both kept black as per premium feel
            secondary: '#0D0D0D',
            card: '#1A1A1A',
            elevated: '#262626',
        },
        accent: {
            primary: accent.secondary, // Use lighter version for dark mode
            secondary: accent.tertiary,
            tertiary: '#FFFFFF',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#E5E7EB',
            tertiary: '#9CA3AF',
            disabled: '#6B7280',
            inverse: '#000000',
        },
        border: {
            primary: '#333333',
            secondary: '#1A1A1A',
            accent: accent.secondary,
        },
        status: {
            active: accent.secondary,
            inactive: '#6B7280',
            completed: '#10B981',
            error: '#EF4444',
        },
        nutrition: {
            protein: accent.secondary,
            carbs: '#F59E0B',
            fats: '#10B981',
            calories: accent.tertiary,
        },
    };
};

// Default static themes (keeping for compatibility)
export const lightTheme = getThemeColors('light', 'purple');
export const darkTheme = getThemeColors('dark', 'purple');

export const spacing = {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const borderRadius = {
    sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
};

export const shadows = {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
};

export const colors = darkTheme;
