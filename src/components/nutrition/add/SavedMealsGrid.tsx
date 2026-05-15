import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../store/useTheme';
import { SavedMeal } from '../../../services/savedMealsService';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40 - 12) / 2;

interface SavedMealsGridProps {
    meals: SavedMeal[];
    onSelect: (meal: SavedMeal) => void;
    onLongPress: (meal: SavedMeal) => void;
}

export const SavedMealsGrid: React.FC<SavedMealsGridProps> = ({ meals, onSelect, onLongPress }) => {
    const { colors } = useTheme();

    const getMealIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('breakfast')) return '🍳';
        if (n.includes('lunch')) return '🥗';
        if (n.includes('dinner')) return '🍽️';
        if (n.includes('snack')) return '🍪';
        return '🍱';
    };

    const calculateCalories = (meal: SavedMeal) => {
        return meal.items.reduce((sum, item) => sum + (item.calories || 0), 0);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text.secondary }]}>YOUR TEMPLATES</Text>
            </View>
            <View style={styles.grid}>
                {meals.map((meal) => (
                    <TouchableOpacity 
                        key={meal.id}
                        style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary, width: COLUMN_WIDTH }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onSelect(meal);
                        }}
                        onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            onLongPress(meal);
                        }}
                    >
                        <View style={styles.iconContainer}>
                            <Text style={styles.emoji}>{getMealIcon(meal.name)}</Text>
                        </View>
                        <Text style={[styles.mealName, { color: colors.text.primary }]} numberOfLines={1}>
                            {meal.name}
                        </Text>
                        <Text style={[styles.mealStats, { color: colors.text.tertiary }]}>
                            {meal.items.length} items • {calculateCalories(meal)} kcal
                        </Text>
                    </TouchableOpacity>
                ))}

                {meals.length === 0 && (
                    <View style={styles.empty}>
                        <Ionicons name="star-outline" size={40} color={colors.text.disabled} />
                        <Text style={[styles.emptyText, { color: colors.text.disabled }]}>No saved meals yet</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 12,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emoji: {
        fontSize: 24,
    },
    mealName: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    mealStats: {
        fontSize: 11,
        marginTop: 4,
        textAlign: 'center',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
    },
});
