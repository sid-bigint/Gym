import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, Platform, TextInput, Modal, Animated } from 'react-native';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useTheme } from '../../src/store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { spacing, borderRadius, shadows } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { PREDEFINED_BUNDLES } from '../../src/data/exploreBundles';

const { width } = Dimensions.get('window');



export default function ExploreRoutinesScreen() {
    const { colors } = useTheme();
    const { exercises, routines, loadExercises, createRoutine } = useWorkoutStore();
    const [selectedType, setSelectedType] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState<typeof PREDEFINED_BUNDLES[0] | null>(null);
    const [addedRoutinesCount, setAddedRoutinesCount] = useState(0);
    const [modalScale] = useState(new Animated.Value(0));

    const types = ['All', ...new Set(PREDEFINED_BUNDLES.map(t => t.type))];
    const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

    const recommendedIds = ['ppl-bundle', 'abs-core-sculpt', 'beginner-strength-5x5', 'dumbbell-only', 'upper-lower-bundle'];

    useEffect(() => {
        loadExercises();
    }, []);

    const filteredBundles = PREDEFINED_BUNDLES.filter(t => {
        const matchesType = selectedType === 'All' || t.type === selectedType;
        const matchesLevel = selectedLevel === 'All' || t.level === selectedLevel;
        const query = searchQuery.toLowerCase();

        const matchesSearch = t.name.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.level.toLowerCase().includes(query) ||
            t.type.toLowerCase().includes(query) ||
            t.muscles.some(m => m.toLowerCase().includes(query));

        return matchesType && matchesLevel && matchesSearch;
    }).sort((a, b) => {
        // Only prioritize recommended bundles when Type is All and Search is empty
        if (selectedType === 'All' && searchQuery === '') {
            const indexA = recommendedIds.indexOf(a.id);
            const indexB = recommendedIds.indexOf(b.id);

            // If both are recommended, sort by the recommendedIds order
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            // If a is recommended, it comes first
            if (indexA !== -1) return -1;
            // If b is recommended, it comes first
            if (indexB !== -1) return 1;
        }
        // Otherwise keep original order (or you could filter by other things here)
        return 0;
    });

    const handleApplyBundle = async (bundle: typeof PREDEFINED_BUNDLES[0]) => {
        try {
            let addedCount = 0;
            const existingRoutineNames = routines.map(r => r.name.toLowerCase());

            for (const routineTemplate of bundle.routines) {
                // Skip if routine already exists
                if (existingRoutineNames.includes(routineTemplate.name.toLowerCase())) {
                    console.log(`Skipping duplicate routine: ${routineTemplate.name}`);
                    continue;
                }

                const routineExercises = routineTemplate.exercises.map(te => {
                    const ex = exercises.find(e => e.name.toLowerCase() === te.name.toLowerCase());
                    return {
                        exerciseId: ex ? ex.id : null,
                        sets: te.sets,
                        reps: te.reps
                    };
                }).filter(re => re.exerciseId !== null) as { exerciseId: number; sets: number; reps: number }[];

                if (routineExercises.length > 0) {
                    await createRoutine(routineTemplate.name, routineExercises, bundle.id);
                    addedCount++;
                }
            }

            if (addedCount === 0) {
                // Use a simpler alert for errors or just ignore/toast if possible, but for now specific error alert is fine
                // or we can reuse the modal for failure? The user specifically asked for "alert that comes AFTER ADDING"
                alert("These routines are already in your library.");
                return;
            }

            setAddedRoutinesCount(addedCount);
            setShowSuccessModal(true);
            Animated.spring(modalScale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10
            }).start();

        } catch (error) {
            console.error(error);
            alert("Failed to add routines.");
        }
    };

    const handleCloseModal = (navigate: boolean) => {
        Animated.timing(modalScale, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true
        }).start(() => {
            setShowSuccessModal(false);
            if (navigate) {
                router.replace('/(tabs)/routines');
            }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <Stack.Screen options={{
                headerShown: true,
                headerTitle: 'Explore Programs',
                headerLargeTitle: true,
                headerBlurEffect: 'regular',
                headerTransparent: false,
                headerStyle: { backgroundColor: colors.background.primary },
                headerTitleStyle: { color: colors.text.primary, fontWeight: '800' },
            }} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Search Bar - Hevy Style */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                        <Ionicons name="search" size={18} color={colors.text.tertiary} />
                        <TextInput
                            style={{
                                flex: 1,
                                marginLeft: 8,
                                color: colors.text.primary,
                                fontSize: 15,
                            }}
                            placeholder="Search programs or muscles..."
                            placeholderTextColor={colors.text.tertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>



                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingRight: 40 }}>
                    {types.map(type => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setSelectedType(type)}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: selectedType === type ? colors.accent.primary : colors.background.card,
                                    borderColor: colors.border.primary
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText,
                                { color: selectedType === type ? 'white' : colors.text.secondary }
                            ]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Difficulty Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingRight: 40 }}>
                    {levels.map(lvl => (
                        <TouchableOpacity
                            key={lvl}
                            onPress={() => setSelectedLevel(lvl)}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: selectedLevel === lvl ? colors.accent.secondary : colors.background.card,
                                    borderColor: colors.border.primary
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText,
                                { color: selectedLevel === lvl ? 'white' : colors.text.secondary }
                            ]}>
                                {lvl}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Official Programs</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.text.tertiary }]}>Curated by experts for maximum results</Text>
                </View>

                {/* Bundle Cards - Hevy Style */}
                <View style={styles.cardsContainer}>
                    {filteredBundles.map(bundle => (
                        <View
                            key={bundle.id}
                            style={[styles.hevyCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                        >
                            <View style={styles.cardInfo}>
                                <View style={styles.cardHeaderRow}>
                                    <View>
                                        <Text style={[styles.hevyTemplateName, { color: colors.text.primary }]}>{bundle.name}</Text>
                                        <View style={styles.metaRow}>
                                            <Text style={[styles.metaText, { color: colors.text.tertiary }]}>{bundle.level} • {bundle.routines.length} Workouts</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.officialBadge, { backgroundColor: colors.accent.primary + '15' }]}>
                                        <Ionicons name="shield-checkmark" size={14} color={colors.accent.primary} />
                                        <Text style={[styles.officialText, { color: colors.accent.primary }]}>OFFICIAL</Text>
                                    </View>
                                </View>

                                <Text style={[styles.hevyDescription, { color: colors.text.secondary }]}>
                                    {bundle.description}
                                </Text>

                                <View style={styles.muscleTagContainer}>
                                    {bundle.muscles.map(muscle => (
                                        <View key={muscle} style={[styles.muscleTag, { backgroundColor: colors.background.primary }]}>
                                            <Text style={[styles.muscleTagText, { color: colors.text.secondary }]}>{muscle}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.programPreview}>
                                    {bundle.routines.map((r, idx) => (
                                        <View key={idx} style={styles.previewItem}>
                                            <Ionicons name="barbell-outline" size={14} color={colors.text.tertiary} />
                                            <Text style={[styles.previewText, { color: colors.text.secondary }]}>{r.name}</Text>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.hevyApplyButton, { backgroundColor: colors.accent.primary + '20' }]}
                                    onPress={() => setSelectedBundle(bundle)}
                                >
                                    <Text style={[styles.hevyApplyButtonText, { color: colors.accent.primary }]}>View Details</Text>
                                    <Ionicons name="arrow-forward" size={18} color={colors.accent.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Custom Success Modal */}
            <Modal
                transparent
                visible={showSuccessModal}
                animationType="fade"
                onRequestClose={() => handleCloseModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[
                        styles.modalContainer,
                        {
                            backgroundColor: colors.background.card,
                            borderColor: colors.border.primary,
                            transform: [{ scale: modalScale }]
                        }
                    ]}>
                        <View style={[styles.modalIconContainer, { backgroundColor: colors.accent.primary + '20' }]}>
                            <Ionicons name="checkmark-circle" size={48} color={colors.accent.primary} />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Success!</Text>
                        <Text style={[styles.modalMessage, { color: colors.text.secondary }]}>
                            Successfully added {addedRoutinesCount} new routine{addedRoutinesCount !== 1 ? 's' : ''} to your library.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButtonSecondary, { borderColor: colors.border.primary }]}
                                onPress={() => handleCloseModal(false)}
                            >
                                <Text style={[styles.modalButtonTextSecondary, { color: colors.text.primary }]}>Keep Exploring</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButtonPrimary, { backgroundColor: colors.accent.primary }]}
                                onPress={() => handleCloseModal(true)}
                            >
                                <Text style={styles.modalButtonTextPrimary}>View Routines</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Program Details Pop-up Modal */}
            <Modal
                visible={!!selectedBundle}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedBundle(null)}
            >
                {selectedBundle && (
                    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
                        {/* Header with Close Button */}
                        <View style={{
                            position: 'absolute',
                            top: Platform.OS === 'ios' ? 12 : 20,
                            right: 20,
                            zIndex: 10,
                        }}>
                            <TouchableOpacity
                                onPress={() => setSelectedBundle(null)}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                            {/* Hero Section */}
                            <View style={styles.heroContainer}>
                                {/* Background Image if available */}
                                {(selectedBundle as any).image && (
                                    <Image
                                        source={{ uri: (selectedBundle as any).image }}
                                        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
                                        resizeMode="cover"
                                    />
                                )}

                                {(() => {
                                    // Determine colors safely
                                    const hasImage = !!(selectedBundle as any).image;
                                    const gradientColors = hasImage
                                        ? ['transparent', 'rgba(0,0,0,0.9)']
                                        : (selectedBundle.gradient as string[]); // Cast to string[] assuming data is correct

                                    return (
                                        <LinearGradient
                                            colors={gradientColors}
                                            style={styles.heroGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                        >
                                            <View style={styles.heroContent}>
                                                <View style={[styles.levelBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                                    <Text style={styles.levelText}>{selectedBundle.level}</Text>
                                                </View>
                                                <Text style={styles.heroTitle}>{selectedBundle.name}</Text>
                                                <Text style={styles.heroType}>{selectedBundle.type} Series</Text>
                                            </View>
                                        </LinearGradient>
                                    );
                                })()}
                            </View>

                            <View style={styles.contentContainer}>
                                {/* Stats Row */}
                                <View style={[styles.statsRow, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="calendar-outline" size={20} color={colors.text.tertiary} />
                                        <Text style={[styles.statValue, { color: colors.text.primary }]}>{selectedBundle.routines.length} Days</Text>
                                    </View>
                                    <View style={[styles.dividerVertical, { backgroundColor: colors.border.primary }]} />
                                    <View style={styles.statItem}>
                                        <Ionicons name="barbell-outline" size={20} color={colors.text.tertiary} />
                                        <Text style={[styles.statValue, { color: colors.text.primary }]}>
                                            {selectedBundle.routines.reduce((acc, r) => acc + r.exercises.length, 0)} Ex
                                        </Text>
                                    </View>
                                    <View style={[styles.dividerVertical, { backgroundColor: colors.border.primary }]} />
                                    <View style={styles.statItem}>
                                        <Ionicons name="body-outline" size={20} color={colors.text.tertiary} />
                                        <Text style={[styles.statValue, { color: colors.text.primary }]}>{selectedBundle.muscles[0]}</Text>
                                    </View>
                                </View>

                                {/* Description */}
                                <View style={styles.section}>
                                    <Text style={[styles.sectionHeader, { color: colors.text.primary }]}>About</Text>
                                    <Text style={[styles.descriptionText, { color: colors.text.secondary }]}>
                                        {selectedBundle.description}
                                    </Text>
                                </View>

                                {/* Routine Breakdown */}
                                <View style={styles.section}>
                                    <Text style={[styles.sectionHeader, { color: colors.text.primary }]}>Schedule</Text>
                                    <View style={{ gap: 12 }}>
                                        {selectedBundle.routines.map((routine, index) => (
                                            <View key={index} style={[styles.routineCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                                                <View style={styles.routineHeader}>
                                                    <View style={[styles.dayBadge, { backgroundColor: colors.accent.primary + '15' }]}>
                                                        <Text style={[styles.dayText, { color: colors.accent.primary }]}>Day {index + 1}</Text>
                                                    </View>
                                                    <Text style={[styles.routineName, { color: colors.text.primary }]}>{routine.name}</Text>
                                                </View>
                                                <View style={{ marginTop: 12, gap: 12 }}>
                                                    {routine.exercises.map((ex, i) => {
                                                        // Find full exercise data to get image
                                                        const fullExercise = exercises.find(e => e.name.toLowerCase() === ex.name.toLowerCase());

                                                        return (
                                                            <View key={i} style={{
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                backgroundColor: colors.background.primary,
                                                                padding: 8,
                                                                borderRadius: 12,
                                                                borderWidth: 1,
                                                                borderColor: colors.border.secondary
                                                            }}>
                                                                {/* Exercise Image */}
                                                                <View style={{
                                                                    width: 48,
                                                                    height: 48,
                                                                    borderRadius: 8,
                                                                    backgroundColor: colors.background.elevated,
                                                                    marginRight: 12,
                                                                    overflow: 'hidden',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center'
                                                                }}>
                                                                    {fullExercise?.images?.[0] ? (
                                                                        <Image
                                                                            source={{ uri: fullExercise.images[0] }}
                                                                            style={{ width: '100%', height: '100%' }}
                                                                            resizeMode="cover"
                                                                        />
                                                                    ) : (
                                                                        <Ionicons name="barbell" size={20} color={colors.text.tertiary} />
                                                                    )}
                                                                </View>

                                                                {/* Exercise Info */}
                                                                <View style={{ flex: 1 }}>
                                                                    <Text style={{
                                                                        fontSize: 14,
                                                                        fontWeight: '600',
                                                                        color: colors.text.primary,
                                                                        marginBottom: 2
                                                                    }}>
                                                                        {ex.name}
                                                                    </Text>
                                                                    <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                                                                        {ex.sets} sets × {ex.reps} reps
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Bottom Action Bar */}
                        <View style={[styles.actionBar, { backgroundColor: colors.background.card, borderTopColor: colors.border.primary }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionTitle, { color: colors.text.primary }]}>Add Program</Text>
                                <Text style={[styles.actionSubtitle, { color: colors.text.tertiary }]}>{selectedBundle.routines.length} routines</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: colors.accent.primary }]}
                                onPress={() => {
                                    handleApplyBundle(selectedBundle);
                                    setSelectedBundle(null);
                                }}
                            >
                                <Text style={styles.addButtonText}>Add to Library</Text>
                                <Ionicons name="add" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: spacing.md,
    },
    searchContainer: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
    },
    filterScroll: {
        paddingLeft: spacing.xl,
        marginBottom: spacing.xl,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        marginRight: 8,
        borderWidth: 1,
    },
    chipText: {
        fontWeight: '700',
        fontSize: 13,
    },
    sectionHeader: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 2,
    },
    sectionSubtitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    cardsContainer: {
        paddingHorizontal: spacing.xl,
        gap: 16,
    },
    hevyCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 1,
    },
    cardInfo: {
        padding: 20,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    hevyTemplateName: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
    },
    officialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    officialText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    hevyDescription: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 16,
    },
    muscleTagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
    },
    muscleTag: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    muscleTagText: {
        fontSize: 11,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    programPreview: {
        marginBottom: 20,
        gap: 8,
    },
    previewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    previewText: {
        fontSize: 13,
        fontWeight: '500',
    },
    hevyApplyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        gap: 8,
    },
    hevyApplyButtonText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 15,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        // Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    modalButtonSecondary: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    modalButtonPrimary: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonTextSecondary: {
        fontWeight: '700',
        fontSize: 15,
    },
    modalButtonTextPrimary: {
        fontWeight: '700',
        fontSize: 15,
        color: 'white',
    },
    // Pop-up Details Styles
    heroContainer: {
        height: 250,
        width: '100%',
    },
    heroGradient: {
        flex: 1,
        padding: spacing.xl,
        justifyContent: 'flex-end',
    },
    heroContent: {
        gap: 6,
    },
    levelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        marginBottom: 4,
    },
    levelText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    heroTitle: {
        color: 'white',
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 34,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    heroType: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        fontWeight: '600',
    },
    contentContainer: {
        padding: spacing.xl,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        backgroundColor: 'transparent',
        gap: 24,
    },
    statsRow: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    dividerVertical: {
        width: 1,
        height: 30,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    section: {
        gap: 12,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
    },
    routineCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    routineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    dayBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dayText: {
        fontWeight: '800',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    routineName: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    actionSubtitle: {
        fontSize: 12,
    },
    addButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    }
});
