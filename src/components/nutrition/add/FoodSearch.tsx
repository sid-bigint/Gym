import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../store/useTheme';
import * as Haptics from 'expo-haptics';

interface FoodSearchProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    recentFoods: any[];
    searchResults: any[];
    onSelectFood: (food: any) => void;
}

export const FoodSearch: React.FC<FoodSearchProps> = ({
    searchQuery,
    onSearchChange,
    recentFoods,
    searchResults,
    onSelectFood
}) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <View style={[styles.searchBar, { backgroundColor: colors.background.elevated, borderColor: colors.border.primary }]}>
                <Ionicons name="search" size={20} color={colors.text.tertiary} />
                <TextInput 
                    style={[styles.input, { color: colors.text.primary }]}
                    placeholder="Search foods, snacks, drinks..."
                    placeholderTextColor={colors.text.disabled}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => onSearchChange('')}>
                        <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
                {recentFoods.length > 0 && searchQuery.length === 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>RECENT & FREQUENT</Text>
                        <View style={styles.chipRow}>
                            {recentFoods.map((food, idx) => (
                                <TouchableOpacity 
                                    key={idx}
                                    style={[styles.chip, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        onSelectFood(food);
                                    }}
                                >
                                    <Text style={[styles.chipLabel, { color: colors.text.primary }]}>{food.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
                        {searchQuery.length > 0 ? 'SEARCH RESULTS' : 'RECOMMENDED'}
                    </Text>
                    
                    {searchResults.map((food, idx) => (
                        <TouchableOpacity 
                            key={food.id || idx}
                            style={[styles.resultItem, { borderBottomColor: colors.border.secondary }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onSelectFood(food);
                            }}
                        >
                            <View style={styles.resultMain}>
                                <Text style={[styles.resultName, { color: colors.text.primary }]}>{food.name}</Text>
                                <Text style={[styles.resultSub, { color: colors.text.tertiary }]}>
                                    {food.category || 'General Food'}
                                </Text>
                            </View>
                            <View style={styles.resultRight}>
                                <Text style={[styles.resultCal, { color: colors.accent.primary }]}>{food.per100g.calories}</Text>
                                <Text style={[styles.resultUnit, { color: colors.text.tertiary }]}>kcal/100g</Text>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {searchResults.length === 0 && searchQuery.length > 0 && (
                        <View style={styles.noResults}>
                            <Text style={[styles.noResultsText, { color: colors.text.disabled }]}>
                                No foods found matching "{searchQuery}"
                            </Text>
                            <TouchableOpacity style={styles.addCustomLink}>
                                <Text style={[styles.addCustomLinkText, { color: colors.accent.primary }]}>
                                    + Add as custom food
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        fontSize: 15,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    chipLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    resultMain: {
        flex: 1,
    },
    resultName: {
        fontSize: 15,
        fontWeight: '600',
    },
    resultSub: {
        fontSize: 12,
        marginTop: 2,
    },
    resultRight: {
        alignItems: 'flex-end',
    },
    resultCal: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    resultUnit: {
        fontSize: 10,
    },
    noResults: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    noResultsText: {
        fontSize: 14,
        marginBottom: 12,
    },
    addCustomLink: {
        padding: 8,
    },
    addCustomLinkText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
