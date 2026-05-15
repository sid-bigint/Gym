import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionStore, RecentFood } from '../../store/useNutritionStore';
import { useTheme } from '../../store/useTheme';
import { SavedMeal } from '../../services/savedMealsService';

interface ShortcutsBarProps {
    onSelectRecent: (food: RecentFood) => void;
    onSelectSavedMeal: (meal: SavedMeal) => void;
    onLongPressSavedMeal: (meal: SavedMeal) => void;
    onCopyYesterday: () => void;
}

export const ShortcutsBar: React.FC<ShortcutsBarProps> = ({ 
    onSelectRecent, 
    onSelectSavedMeal, 
    onLongPressSavedMeal,
    onCopyYesterday 
}) => {
    const { recentFoods, savedMeals } = useNutritionStore();
    const { colors } = useTheme();

    const sortedRecent = [...recentFoods].sort((a, b) => b.frequency_count - a.frequency_count).slice(0, 5);

    if (recentFoods.length === 0 && savedMeals.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text.tertiary }]}>QUICK LOG</Text>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <TouchableOpacity 
                    style={[styles.shortcut, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}
                    onPress={onCopyYesterday}
                >
                    <View style={[styles.iconContainer, { backgroundColor: colors.background.elevated }]}>
                        <Ionicons name="copy-outline" size={18} color={colors.accent.primary} />
                    </View>
                    <Text style={[styles.label, { color: colors.text.primary }]} numberOfLines={1}>Yesterday</Text>
                </TouchableOpacity>

                {savedMeals.slice(0, 3).map((meal) => (
                    <TouchableOpacity 
                        key={`saved-${meal.id}`} 
                        style={[styles.shortcut, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}
                        onPress={() => onSelectSavedMeal(meal)}
                        onLongPress={() => onLongPressSavedMeal(meal)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: colors.background.elevated }]}>
                            <Ionicons name="star" size={18} color="#FFD700" />
                        </View>
                        <Text style={[styles.label, { color: colors.text.primary }]} numberOfLines={1}>{meal.name}</Text>
                        <View style={[styles.badge, { backgroundColor: colors.accent.primary }]}>
                            <Text style={styles.badgeText}>+</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {sortedRecent.map((food) => (
                    <TouchableOpacity 
                        key={`recent-${food.id}`} 
                        style={[styles.shortcut, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}
                        onPress={() => onSelectRecent(food)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: colors.background.elevated }]}>
                            <Ionicons name="time-outline" size={18} color={colors.accent.primary} />
                        </View>
                        <Text style={[styles.label, { color: colors.text.primary }]} numberOfLines={1}>{food.name}</Text>
                        
                        {food.frequency_count > 1 && (
                            <View style={[styles.freqBadge, { backgroundColor: colors.background.elevated }]}>
                                <Text style={[styles.freqText, { color: colors.text.secondary }]}>{food.frequency_count}x</Text>
                            </View>
                        )}

                        <View style={[styles.badge, { backgroundColor: colors.accent.primary }]}>
                            <Text style={styles.badgeText}>+</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    scrollContent: {
        paddingRight: 20,
        gap: 12,
    },
    shortcut: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        minWidth: 120,
        position: 'relative',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff', // Simplified for now, will match theme in final pass if needed
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    freqBadge: {
        position: 'absolute',
        top: 4,
        right: 12,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    freqText: {
        fontSize: 8,
        fontWeight: 'bold',
    }
});
