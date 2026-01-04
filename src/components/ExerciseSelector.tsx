import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Animated, FlatList, LayoutAnimation, Platform, UIManager, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useTheme';
import { Exercise } from '../types';
import { spacing, borderRadius } from '../constants/theme';
import { Button } from './Button';
import { useWorkoutStore } from '../store/useWorkoutStore';

// Enable LayoutAnimation
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 100;

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio/Full Body", "Mobility/Rehab"];
const TYPES = ["All", "Gym", "Calisthenics", "Home", "Yoga", "Cardio", "Mobility", "General"];

const ExerciseCard = ({ ex, isSelected, onPress, onLongPress, colors }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                    { borderColor: isSelected ? colors.accent.primary : colors.border.primary }
                ]}
                onPress={() => onPress(ex)}
                onLongPress={() => onLongPress && onLongPress(ex)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                delayLongPress={300}
            >
                {/* Image Section */}
                <View style={styles.cardImageContainer}>
                    {ex.images && ex.images.length > 0 ? (
                        <Image
                            source={{ uri: ex.images[0] }}
                            style={styles.cardImage}
                            contentFit="cover"
                            transition={200}
                        />
                    ) : (
                        <View style={[styles.placeholderImage, { backgroundColor: colors.background.elevated }]}>
                            <Text style={{ fontSize: 24 }}>{ex.type === 'Yoga' ? '🧘‍♂️' : ex.type === 'Cardio' ? '❤️' : '💪'}</Text>
                        </View>
                    )}
                    {/* Info Hint Overlay */}
                    <View style={styles.infoHint}>
                        <Ionicons name="information-circle" size={14} color="white" />
                    </View>
                </View>

                {/* Text Content */}
                <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, isSelected && { color: colors.accent.primary }]}>
                        {ex.name}
                    </Text>
                    <View style={styles.cardBadges}>
                        <View style={[styles.badge, { backgroundColor: colors.background.elevated }]}>
                            <Text style={[styles.badgeText, { color: colors.text.secondary }]}>{ex.muscleGroup}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.background.elevated }]}>
                            <Text style={[styles.badgeText, { color: colors.text.tertiary }]}>{ex.type}</Text>
                        </View>
                    </View>
                </View>

                {/* Selection Checkbox */}
                <View style={[styles.checkbox, isSelected && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color={colors.text.inverse} />}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

interface ExerciseSelectorProps {
    onClose: () => void;
    onSelect: (exercises: Exercise[]) => void;
    initialSelected?: number[]; // IDs of initially selected exercises
    multiSelect?: boolean;
    buttonLabel?: string;
    onExerciseLongPress?: (ex: Exercise) => void;
}

export const ExerciseSelector = ({
    onClose,
    onSelect,
    initialSelected = [],
    multiSelect = true,
    buttonLabel = "Done",
    onExerciseLongPress
}: ExerciseSelectorProps) => {
    const { exercises, loadExercises } = useWorkoutStore();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [selectedIds, setSelectedIds] = useState<number[]>(initialSelected);

    // Filtering
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedType, setSelectedType] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Footer Animation
    const footerAnim = useRef(new Animated.Value(150)).current;

    useEffect(() => {
        loadExercises();
    }, []);

    useEffect(() => {
        if (selectedIds.length > 0) {
            Animated.spring(footerAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
        } else {
            if (multiSelect) {
                Animated.timing(footerAnim, { toValue: 150, duration: 200, useNativeDriver: true }).start();
            }
        }
    }, [selectedIds.length]);

    const toggleSelection = (ex: Exercise) => {
        if (multiSelect) {
            if (selectedIds.includes(ex.id)) {
                setSelectedIds(prev => prev.filter(id => id !== ex.id));
            } else {
                setSelectedIds(prev => [...prev, ex.id]);
            }
        } else {
            // Single select mode - return immediately
            onSelect([ex]);
            onClose();
        }
    };

    const handleDone = () => {
        const selected = exercises.filter(e => selectedIds.includes(e.id));
        onSelect(selected);
        onClose();
    };

    // Derived List
    const filteredList = useMemo(() => {
        if (!exercises || exercises.length === 0) return [];

        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);

        return exercises.filter(ex => {
            // Multi-word substring match (matches if ALL terms are found in either name or category)
            const matchesSearch = searchTerms.length === 0 || searchTerms.every(term =>
                ex.name.toLowerCase().includes(term) ||
                ex.muscleGroup.toLowerCase().includes(term)
            );

            const matchesCategory = selectedCategory === "All" || ex.muscleGroup === selectedCategory;
            const matchesType = selectedType === "All" || ex.type === selectedType;

            return matchesSearch && matchesCategory && matchesType;
        });
    }, [exercises, selectedCategory, selectedType, searchQuery]);

    return (
        <View style={styles.selectionView}>
            {/* Header */}
            <View style={styles.selectionHeader}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.selectionTitle}>Select Exercises</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={colors.text.tertiary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search name, muscle, etc..."
                    placeholderTextColor={colors.text.disabled}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={colors.text.disabled} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Controls */}
            <View style={styles.filtersContainer}>
                {/* Category Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[styles.categoryChipText, { color: selectedCategory === cat ? 'white' : colors.text.secondary }]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Types Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScroll}>
                    {TYPES.map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.typeChip,
                                selectedType === type && { backgroundColor: colors.accent.secondary + '20', borderColor: colors.accent.secondary }
                            ]}
                            onPress={() => setSelectedType(type)}
                        >
                            <Text style={[styles.typeChipText, { color: selectedType === type ? colors.accent.secondary : colors.text.tertiary }]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={filteredList}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                        <ExerciseCard
                            ex={item}
                            isSelected={isSelected}
                            onPress={() => toggleSelection(item)}
                            onLongPress={onExerciseLongPress}
                            colors={colors}
                        />
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        {exercises.length === 0 ? (
                            <>
                                <ActivityIndicator size="small" color={colors.text.tertiary} />
                                <Text style={{ color: colors.text.tertiary, marginTop: 8 }}>Loading database...</Text>
                            </>
                        ) : (
                            <Text style={{ color: colors.text.tertiary }}>No exercises found</Text>
                        )}
                    </View>
                }
            />

            {/* Footer Button for MultiSelect */}
            {multiSelect && (
                <Animated.View style={[styles.stickyFooter, { transform: [{ translateY: footerAnim }] }]}>
                    <Button
                        title={selectedIds.length > 0 ? `Add ${selectedIds.length} Exercises` : buttonLabel}
                        onPress={handleDone}
                    />
                </Animated.View>
            )}
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    // Selection View
    selectionView: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    selectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        paddingTop: spacing.xl,
        backgroundColor: colors.background.primary,
    },
    closeButton: {
        padding: 4,
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        margin: spacing.lg,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        height: 44,
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 16,
        color: colors.text.primary,
    },
    filtersContainer: {
        backgroundColor: colors.background.primary,
        paddingBottom: spacing.sm,
        zIndex: 10,
    },
    categoryScroll: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 12,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.background.elevated,
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '700',
    },
    typeScroll: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 12,
        gap: 8,
    },
    typeChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    typeChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: spacing.xxl,
    },

    // Card Styles
    // Card Styles
    card: {
        flexDirection: 'row',
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        padding: spacing.sm,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        minHeight: 110,
    },
    cardSelected: {
        backgroundColor: colors.background.elevated,
    },
    cardImageContainer: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
        marginRight: spacing.md,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoHint: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        padding: 2,
    },
    cardContent: {
        flex: 1,
        paddingVertical: spacing.xs,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
        lineHeight: 20,
    },
    cardBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border.secondary,
        marginRight: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Sticky Footer
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.xl,
        paddingBottom: spacing.xxl,
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});
