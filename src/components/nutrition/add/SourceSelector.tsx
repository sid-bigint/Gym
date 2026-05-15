import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../store/useTheme';
import * as Haptics from 'expo-haptics';

interface SourceSelectorProps {
    selectedMealType: string;
    onSelectMealType: (type: string) => void;
    onSelectSource: (source: 'search' | 'saved' | 'custom') => void;
    onClose: () => void;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
    selectedMealType,
    onSelectMealType,
    onSelectSource,
    onClose
}) => {
    const { colors } = useTheme();

    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

    const handleSourceSelect = (source: 'search' | 'saved' | 'custom') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelectSource(source);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.text.primary }]}>Add Food</Text>
                    <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>Choose how to add to your log</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity 
                    style={[styles.sourceCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                    onPress={() => handleSourceSelect('search')}
                >
                    <View style={[styles.iconBox, { backgroundColor: colors.accent.primary + '15' }]}>
                        <Ionicons name="search" size={24} color={colors.accent.primary} />
                    </View>
                    <View style={styles.sourceInfo}>
                        <Text style={[styles.sourceTitle, { color: colors.text.primary }]}>Global Food Library</Text>
                        <Text style={[styles.sourceDesc, { color: colors.text.tertiary }]}>Explore 2000+ verified food items</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.sourceCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                    onPress={() => handleSourceSelect('saved')}
                >
                    <View style={[styles.iconBox, { backgroundColor: '#FACC1515' }]}>
                        <Ionicons name="star" size={24} color="#FACC15" />
                    </View>
                    <View style={styles.sourceInfo}>
                        <Text style={[styles.sourceTitle, { color: colors.text.primary }]}>Saved Meals</Text>
                        <Text style={[styles.sourceDesc, { color: colors.text.tertiary }]}>Use your custom templates</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.sourceCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                    onPress={() => handleSourceSelect('custom')}
                >
                    <View style={[styles.iconBox, { backgroundColor: colors.accent.secondary + '15' }]}>
                        <Ionicons name="add" size={28} color={colors.accent.secondary} />
                    </View>
                    <View style={styles.sourceInfo}>
                        <Text style={[styles.sourceTitle, { color: colors.text.primary }]}>Create Custom Food</Text>
                        <Text style={[styles.sourceDesc, { color: colors.text.tertiary }]}>Add new food to your library</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
                </TouchableOpacity>

                <View style={styles.mealTypeSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>LOGGING FOR</Text>
                    <View style={styles.chipRow}>
                        {mealTypes.map(type => (
                            <TouchableOpacity 
                                key={type}
                                style={[
                                    styles.chip, 
                                    { borderColor: colors.border.primary },
                                    selectedMealType === type && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    onSelectMealType(type);
                                }}
                            >
                                <Text style={[
                                    styles.chipLabel, 
                                    { color: colors.text.secondary },
                                    selectedMealType === type && { color: colors.text.inverse }
                                ]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '70%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    sourceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    sourceInfo: {
        flex: 1,
    },
    sourceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    sourceDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    mealTypeSection: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 11,
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
});
