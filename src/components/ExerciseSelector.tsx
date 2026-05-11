import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useTheme';
import { Exercise } from '../types';
import { spacing, borderRadius } from '../constants/theme';
import { Button } from './Button';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { CreateExerciseModal } from './CreateExerciseModal';
import { ExerciseDetailsModal } from './ExerciseDetailsModal';

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio/Full Body", "Mobility/Rehab"];
const TYPES = ["All", "Gym", "Calisthenics", "Home", "Yoga", "Cardio", "Mobility", "General"];

interface ExerciseSelectorProps {
    onClose: () => void;
    onSelect: (exercises: Exercise[]) => void;
    initialSelected?: number[];
    multiSelect?: boolean;
    buttonLabel?: string;
    onExerciseLongPress?: (ex: Exercise) => void;
}

const getTerms = (value: string) => value.toLowerCase().trim().split(/\s+/).filter(Boolean);

export const ExerciseSelector = ({
    onClose,
    onSelect,
    initialSelected = [],
    multiSelect = true,
    buttonLabel = "Done",
    onExerciseLongPress,
}: ExerciseSelectorProps) => {
    const { exercises, loadExercises, deleteExercise } = useWorkoutStore();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [selectedIds, setSelectedIds] = useState<number[]>(initialSelected);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedType, setSelectedType] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

    const footerAnim = useRef(new Animated.Value(multiSelect && initialSelected.length === 0 ? 150 : 0)).current;
    const initialSelectedKey = initialSelected.join(',');

    useEffect(() => {
        loadExercises();
    }, [loadExercises]);

    useEffect(() => {
        setSelectedIds(initialSelected);
    }, [initialSelectedKey, initialSelected]);

    useEffect(() => {
        if (!multiSelect) return;
        Animated.spring(footerAnim, {
            toValue: selectedIds.length > 0 ? 0 : 150,
            useNativeDriver: true,
            friction: 8,
        }).start();
    }, [footerAnim, selectedIds.length, multiSelect]);

    const selectedExercises = useMemo(
        () => selectedIds
            .map(id => exercises.find(ex => ex.id === id))
            .filter((ex): ex is Exercise => Boolean(ex)),
        [exercises, selectedIds]
    );

    const filteredList = useMemo(() => {
        const terms = getTerms(searchQuery);

        return exercises.filter(ex => {
            const searchable = [
                ex.name,
                ex.muscleGroup,
                ex.type,
                ...(ex.instructions || []),
            ].join(' ').toLowerCase();

            const matchesSearch = terms.length === 0 || terms.every(term => searchable.includes(term));
            const matchesCategory = selectedCategory === "All" || ex.muscleGroup === selectedCategory;
            const matchesType = selectedType === "All" || ex.type === selectedType;

            return matchesSearch && matchesCategory && matchesType;
        });
    }, [exercises, searchQuery, selectedCategory, selectedType]);

    const hasFilters = selectedCategory !== "All" || selectedType !== "All" || searchQuery.length > 0;

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('All');
        setSelectedType('All');
    };

    const clearSelection = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedIds([]);
    };

    const toggleSelection = (ex: Exercise) => {
        if (!multiSelect) {
            onSelect([ex]);
            onClose();
            return;
        }

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedIds(prev => prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id]);
    };

    const handleDone = () => {
        onSelect(selectedExercises);
        onClose();
    };

    const handleDetails = (ex: Exercise) => {
        if (onExerciseLongPress) {
            onExerciseLongPress(ex);
        } else {
            setDetailExercise(ex);
        }
    };

    const handleCreated = (newEx: Exercise) => {
        if (multiSelect) {
            setSelectedIds(prev => prev.includes(newEx.id) ? prev : [...prev, newEx.id]);
            setShowCreateModal(false);
        } else {
            onSelect([newEx]);
            onClose();
        }
    };

    const handleDeleteStart = (ex: Exercise) => {
        Alert.alert(
            "Delete Exercise",
            `Are you sure you want to delete "${ex.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteExercise(ex.id);
                            setSelectedIds(prev => prev.filter(id => id !== ex.id));
                    } catch {
                        Alert.alert("Error", "Could not delete exercise. It might be in use.");
                    }
                    },
                },
            ]
        );
    };

    const renderExercise = ({ item }: { item: Exercise }) => {
        const isSelected = selectedIds.includes(item.id);

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggleSelection(item)}
                onLongPress={() => handleDetails(item)}
                delayLongPress={300}
                style={[
                    styles.exerciseRow,
                    {
                        backgroundColor: isSelected ? colors.background.elevated : colors.background.primary,
                        borderColor: isSelected ? colors.accent.primary : colors.border.primary,
                    },
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleDetails(item)}
                    style={styles.thumbWrap}
                >
                    {item.images?.length ? (
                        <Image source={{ uri: item.images[0] }} style={styles.thumbnail} contentFit="cover" transition={120} />
                    ) : (
                        <View style={[styles.thumbnail, styles.placeholder, { backgroundColor: colors.background.elevated }]}>
                            <Ionicons name="barbell-outline" size={22} color={colors.text.tertiary} />
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: isSelected ? colors.accent.primary : colors.text.primary }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={[styles.metaText, { color: colors.text.tertiary }]} numberOfLines={1}>{item.muscleGroup}</Text>
                        <View style={[styles.dot, { backgroundColor: colors.text.disabled }]} />
                        <Text style={[styles.metaText, { color: colors.text.tertiary }]} numberOfLines={1}>{item.type}</Text>
                    </View>
                </View>

                {item.isCustom && (
                    <TouchableOpacity
                        onPress={() => handleDeleteStart(item)}
                        style={styles.iconButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="trash-outline" size={18} color={colors.text.tertiary} />
                    </TouchableOpacity>
                )}

                <View style={[styles.checkbox, isSelected && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }]}>
                    {isSelected ? (
                        <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
                    ) : (
                        <Ionicons name="add" size={16} color={colors.text.tertiary} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.selectionView}>
            <View style={styles.selectionHeader}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.selectionTitle}>Select Exercises</Text>
                    <Text style={[styles.selectionSubtitle, { color: colors.text.tertiary }]}>
                        {filteredList.length} shown{selectedIds.length > 0 ? ` • ${selectedIds.length} selected` : ''}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.headerAction}>
                    <Ionicons name="add" size={24} color={colors.accent.primary} />
                </TouchableOpacity>
            </View>

            <View style={[styles.searchShell, { backgroundColor: colors.background.secondary }]}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={colors.text.tertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search name, muscle, type..."
                        placeholderTextColor={colors.text.disabled}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-circle" size={18} color={colors.text.disabled} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                { backgroundColor: colors.background.primary, borderColor: colors.border.primary },
                                selectedCategory === cat && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[styles.categoryChipText, { color: selectedCategory === cat ? colors.text.inverse : colors.text.secondary }]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScroll}>
                    {TYPES.map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.typeChip,
                                { borderColor: colors.border.primary },
                                selectedType === type && { backgroundColor: colors.accent.secondary + '20', borderColor: colors.accent.secondary },
                            ]}
                            onPress={() => setSelectedType(type)}
                        >
                            <Text style={[styles.typeChipText, { color: selectedType === type ? colors.accent.secondary : colors.text.tertiary }]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {hasFilters && (
                        <TouchableOpacity style={styles.clearFilters} onPress={resetFilters}>
                            <Ionicons name="refresh" size={14} color={colors.accent.primary} />
                            <Text style={[styles.clearFiltersText, { color: colors.accent.primary }]}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            <FlatList
                data={filteredList}
                keyExtractor={(item) => item.id.toString()}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
                renderItem={renderExercise}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        {exercises.length === 0 ? (
                            <>
                                <ActivityIndicator size="small" color={colors.text.tertiary} />
                                <Text style={{ color: colors.text.tertiary, marginTop: 8 }}>Loading database...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="search-outline" size={40} color={colors.text.disabled} />
                                <Text style={{ color: colors.text.tertiary, marginTop: 12 }}>No exercises found</Text>
                                <TouchableOpacity style={styles.createInline} onPress={() => setShowCreateModal(true)}>
                                    <Ionicons name="add-circle" size={18} color={colors.accent.primary} />
                                    <Text style={{ color: colors.accent.primary, fontWeight: '700' }}>
                                        {searchQuery ? `Create "${searchQuery}"` : 'Create exercise'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                }
            />

            {multiSelect && (
                <Animated.View
                    style={[
                        styles.stickyFooter,
                        {
                            backgroundColor: colors.background.primary,
                            borderTopColor: colors.border.primary,
                            transform: [{ translateY: footerAnim }],
                        },
                    ]}
                >
                    {selectedExercises.length > 0 && (
                        <>
                            <View style={styles.footerSummary}>
                                <Text style={[styles.footerSummaryText, { color: colors.text.secondary }]}>
                                    {selectedExercises.length} selected
                                </Text>
                                <TouchableOpacity onPress={clearSelection} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Text style={[styles.clearSelectionText, { color: colors.accent.error }]}>Clear</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedTray}>
                                {selectedExercises.map(ex => (
                                    <TouchableOpacity
                                        key={ex.id}
                                        style={[styles.selectedPill, { backgroundColor: colors.background.elevated }]}
                                        onPress={() => toggleSelection(ex)}
                                    >
                                        <Text style={[styles.selectedPillText, { color: colors.text.primary }]} numberOfLines={1}>{ex.name}</Text>
                                        <Ionicons name="close" size={14} color={colors.text.tertiary} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    )}
                    <Button
                        title={selectedIds.length > 0 ? `${buttonLabel} (${selectedIds.length})` : buttonLabel}
                        onPress={handleDone}
                        disabled={selectedIds.length === 0}
                    />
                </Animated.View>
            )}

            <CreateExerciseModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={handleCreated}
            />

            <ExerciseDetailsModal
                visible={!!detailExercise}
                exercise={detailExercise}
                onClose={() => setDetailExercise(null)}
            />
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    selectionView: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    selectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
        paddingBottom: spacing.md,
        backgroundColor: colors.background.primary,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerAction: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text.primary,
    },
    selectionSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    searchShell: {
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.primary,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        height: 46,
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 16,
        color: colors.text.primary,
        height: '100%',
    },
    chipScroll: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '700',
    },
    typeScroll: {
        paddingHorizontal: spacing.lg,
        gap: 8,
        alignItems: 'center',
    },
    typeChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
    },
    typeChipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    clearFilters: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    clearFiltersText: {
        fontSize: 12,
        fontWeight: '800',
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 180,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        padding: spacing.sm,
        marginBottom: spacing.sm,
        minHeight: 76,
    },
    thumbWrap: {
        marginRight: spacing.md,
    },
    thumbnail: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.sm,
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    exerciseInfo: {
        flex: 1,
        minWidth: 0,
    },
    exerciseName: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
        maxWidth: 120,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginHorizontal: 8,
    },
    iconButton: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: colors.border.secondary,
        marginLeft: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xxxl,
    },
    createInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: spacing.md,
    },
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
        borderTopWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    selectedTray: {
        gap: 8,
        paddingBottom: spacing.md,
    },
    footerSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    footerSummaryText: {
        fontSize: 13,
        fontWeight: '800',
    },
    clearSelectionText: {
        fontSize: 13,
        fontWeight: '800',
    },
    selectedPill: {
        maxWidth: 170,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    selectedPillText: {
        maxWidth: 130,
        fontSize: 12,
        fontWeight: '700',
    },
});
