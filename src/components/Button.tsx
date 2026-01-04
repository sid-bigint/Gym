import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
    textStyle?: TextStyle;
    loading?: boolean;
    disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    loading = false,
    disabled = false
}) => {
    const getBackgroundColor = () => {
        if (disabled) return colors.text.disabled;
        switch (variant) {
            case 'primary': return colors.accent.primary;
            case 'secondary': return colors.background.elevated;
            case 'outline': return 'transparent';
            default: return colors.accent.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.text.tertiary;
        switch (variant) {
            case 'primary': return colors.text.primary;
            case 'secondary': return colors.text.primary;
            case 'outline': return colors.accent.primary;
            default: return colors.text.primary;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    borderWidth: variant === 'outline' ? 2 : 0,
                    borderColor: variant === 'outline' ? colors.accent.primary : 'transparent',
                },
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
        minHeight: 56,
    },
    text: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
