import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';

interface SmartSuggestionsBannerProps {
    onPress: () => void;
    message: string;
    actionLabel: string;
}

export const SmartSuggestionsBanner: React.FC<SmartSuggestionsBannerProps> = ({ onPress, message, actionLabel }) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity 
            style={[styles.container, { backgroundColor: colors.accent.primary + '15', borderColor: colors.accent.primary + '30' }]} 
            onPress={onPress}
        >
            <View style={[styles.iconBox, { backgroundColor: colors.accent.primary }]}>
                <Ionicons name="sparkles" size={16} color={colors.text.inverse} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.message, { color: colors.text.primary }]}>{message}</Text>
                <Text style={[styles.action, { color: colors.accent.primary }]}>{actionLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.accent.primary} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    message: {
        fontSize: 14,
        fontWeight: '600',
    },
    action: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 2,
        textTransform: 'uppercase',
    }
});
