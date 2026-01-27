
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Modal, ImageBackground } from 'react-native';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useAlertStore } from '../../src/store/useAlertStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/store/useTheme';
import { useScreenPadding } from '../../src/store/useScreenPadding';
import { spacing, borderRadius, shadows } from '../../src/constants/theme';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { PREDEFINED_BUNDLES } from '../../src/data/exploreBundles';

export default function RoutinesScreen() {
    const { routines, loadRoutines, isLoading, startWorkout, activeWorkout, deleteRoutine } = useWorkoutStore();
    const { colors } = useTheme();
    const { contentTop } = useScreenPadding();
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteProgramId, setDeleteProgramId] = useState<string | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<{ id: string, name: string, routines: any[], bundle?: any } | null>(null);
    const [selectedRoutineIds, setSelectedRoutineIds] = useState<Set<number>>(new Set());

    const isSelectionMode = selectedRoutineIds.size > 0;

    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedRoutineIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedRoutineIds(newSet);
    };

    const handleBulkDelete = async () => {
        if (selectedRoutineIds.size === 0) return;

        useAlertStore.getState().showAlert(
            "Delete Workouts",
            `Are you sure you want to delete ${selectedRoutineIds.size} workout(s)?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        for (const id of Array.from(selectedRoutineIds)) {
                            await deleteRoutine(id);
                        }
                        setSelectedRoutineIds(new Set());
                    }
                }
            ]
        );
    };

    // Group routines by program
    const displayedItems = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        const standalone: any[] = [];

        routines.forEach(r => {
            if (r.programId) {
                if (!groups[r.programId]) groups[r.programId] = [];
                groups[r.programId].push(r);
            } else {
                standalone.push({ type: 'routine', data: r });
            }
        });

        const result: any[] = [];

        // Add Program Groups
        const usedImages = new Set<string>();

        // Add Program Groups
        Object.keys(groups).forEach(pid => {
            const bundle = PREDEFINED_BUNDLES.find((b: any) => b.id === pid);
            let name = 'Unknown Program';
            let programBundle = bundle;

            // Handle AI Generated Programs (New & Legacy)
            if (pid.startsWith('ai|') || pid.startsWith('ai-')) {
                // Try NEW format: ai|Name|Timestamp
                if (pid.startsWith('ai|')) {
                    const parts = pid.split('|');
                    if (parts.length >= 2) {
                        name = parts[1];
                    } else {
                        name = 'AI Workout Plan';
                    }
                }
                // Handle LEGACY format: ai-Timestamp
                else {
                    name = 'AI Generated Plan';
                }

                // Create a synthetic bundle for UI if not predefined
                if (!programBundle) {
                    // Generate a consistent hue based on the ID char codes
                    const charSum = pid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const hue = charSum % 360;

                    // Collect ALL available images from this program's exercises
                    let selectedImage = null;
                    const allImages: string[] = [];

                    try {
                        const programRoutines = groups[pid] || [];
                        programRoutines.forEach(routine => {
                            if (routine.exercises) {
                                routine.exercises.forEach((re: any) => {
                                    if (re.exercise?.images?.length > 0) {
                                        // Add all images found for variation
                                        re.exercise.images.forEach((img: string) => {
                                            if (typeof img === 'string' && img.length > 0) {
                                                allImages.push(img);
                                            }
                                        });
                                    }
                                });
                            }
                        });

                        // Select an image if available
                        if (allImages.length > 0) {
                            // Try to find one we haven't used yet in this list view
                            const unusedImages = allImages.filter(img => !usedImages.has(img));
                            const pool = unusedImages.length > 0 ? unusedImages : allImages;

                            // Pick deterministically based on pid so it doesn't flicker on re-renders,
                            // but effectively "random" relative to the list content
                            const index = charSum % pool.length;
                            selectedImage = pool[index];

                            // Mark as used
                            usedImages.add(selectedImage);
                        }
                    } catch (e) { }

                    programBundle = {
                        id: pid,
                        name: name,
                        description: 'Custom AI Plan',
                        gradient: [
                            `hsl(${hue}, 60%, 40%)`,  // Darker, richer start
                            `hsl(${(hue + 45) % 360}, 65%, 30%)` // Darker, richer end
                        ],
                        image: selectedImage
                    } as any;
                }
            } else {
                name = bundle ? bundle.name : 'Unknown Program';
            }

            result.push({
                type: 'program',
                id: pid,
                name: name,
                routines: groups[pid],
                bundle: programBundle
            });
        });

        // Add Standalone
        return [...result, ...standalone];
    }, [routines]);

    useEffect(() => {
        loadRoutines();
    }, []);

    const handleStartWorkout = async (routineId: number | null) => {
        if (activeWorkout) {
            if (activeWorkout) {
                useAlertStore.getState().showAlert(
                    "Workout in Progress",
                    "You already have an active workout. Finish it first or cancel to start a new one.",
                    [
                        { text: "OK", style: "cancel" },
                        { text: "Go to Active", onPress: () => router.push('/workout/active') }
                    ]
                );
                return;
            }
        }

        try {
            await startWorkout(routineId);
            // Close modal if open
            setSelectedProgram(null);
            router.push('/workout/active');
        } catch (e) {
            useAlertStore.getState().showAlert("Error", "Failed to start workout");
        }
    };

    const handleConfirmDeleteProgram = async () => {
        if (!deleteProgramId) return;

        // Find all routines in this program
        const programRoutines = routines.filter(r => r.programId === deleteProgramId);

        // Delete all
        for (const r of programRoutines) {
            await deleteRoutine(r.id);
        }

        setDeleteProgramId(null);
        setSelectedProgram(null);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteRoutine(deleteId);
            setDeleteId(null);
            // If deleting from within a program modal, we might need to close it if empty?
            // Actually deleteRoutine reloads routines, so useMemo updates.
            // We should check if selectedProgram still has routines.
            // But simplify: just close modal if looking at program? No, keep it open if routines remain.
        }
    };

    // Card Renderer for Standalone Routine
    const renderRoutineData = (item: any, styleOverride?: any, isSelectable: boolean = false) => {
        const isSelected = selectedRoutineIds.has(item.id);

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => {
                    if (isSelectable) {
                        toggleSelection(item.id);
                    }
                }}
                onPress={() => {
                    if (isSelectionMode && isSelectable) {
                        toggleSelection(item.id);
                    }
                }}
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.background.card,
                        borderColor: isSelected ? colors.status.error : colors.border.primary,
                        borderWidth: isSelected ? 2 : 1
                    },
                    styleOverride
                ]}
            >
                <View style={[styles.cardContent, { opacity: (isSelectionMode && !isSelected) ? 0.6 : 1 }]}>
                    <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>{item.name}</Text>
                            <Text style={[styles.cardSubtitle, { color: colors.text.tertiary }]} numberOfLines={1}>
                                {item.exercises?.length > 0
                                    ? item.exercises.map((e: any) => e.exercise?.name).join(', ')
                                    : 'No exercises'}
                            </Text>
                        </View>
                        {isSelected && (
                            <View style={{ backgroundColor: colors.status.error + '20', borderRadius: 12, padding: 4 }}>
                                <Ionicons name="checkmark-circle" size={24} color={colors.status.error} />
                            </View>
                        )}
                    </View>

                    <View style={[styles.actionRow, { opacity: isSelectionMode ? 0.3 : 1 }]} pointerEvents={isSelectionMode ? "none" : "auto"}>
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.background.elevated, marginRight: 8 }]}
                            onPress={() => router.push({ pathname: '/programs/create', params: { id: item.id } })}
                        >
                            <Ionicons name="pencil" size={18} color={colors.text.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: 'rgba(255, 59, 48, 0.1)', marginRight: 'auto' }]}
                            onPress={() => setDeleteId(item.id)}
                        >
                            <Ionicons name="trash" size={18} color={colors.status.error} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.startBtn, { backgroundColor: colors.accent.primary }]}
                            onPress={() => handleStartWorkout(item.id)}
                        >
                            <Text style={[styles.startBtnText, { color: colors.text.inverse }]}>Start</Text>
                            <Ionicons name="play" size={16} color={colors.text.inverse} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Card Renderer for Program Group
    const renderProgramCard = (item: any) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedProgram(item)}
            style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary, height: 160 }]}
        >
            {item.bundle?.image ? (
                <ImageBackground
                    source={{ uri: item.bundle.image }}
                    style={StyleSheet.absoluteFill}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFill}
                    />
                </ImageBackground>
            ) : (
                <LinearGradient
                    colors={item.bundle?.gradient || [colors.accent.primary, colors.accent.secondary]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            )}

            <View style={[styles.cardContent, { justifyContent: 'flex-end', height: '100%' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'auto' }}>
                    <View style={styles.officialBadge}>
                        <Ionicons name="albums" size={12} color="#fff" />
                        <Text style={styles.officialText}>PROGRAM</Text>
                    </View>

                    {/* Program Delete Button */}
                    <TouchableOpacity
                        style={[styles.programDeleteBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
                        onPress={() => setDeleteProgramId(item.id)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.cardTitle, { color: '#fff', fontSize: 22 }]}>{item.name}</Text>
                <Text style={[styles.cardSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                    {item.routines.length} Workouts Inside
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ color: colors.accent.primary, fontWeight: '600', marginRight: 4 }}>View Workouts</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.accent.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderItem = ({ item }: { item: any }) => {
        if (item.type === 'program') {
            return renderProgramCard(item);
        }
        return renderRoutineData(item.data);
    };

    // Safe derived routines for the modal to ensure UI updates on delete
    const modalRoutines = React.useMemo(() => {
        if (!selectedProgram) return [];
        return routines.filter(r => r.programId === selectedProgram.id);
    }, [routines, selectedProgram]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: contentTop }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.text.primary }]}>Workouts</Text>
                    <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Let's get moving</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.accent.secondary }]}
                    onPress={() => router.push('/programs/create')}
                >
                    <Ionicons name="add" size={24} color={colors.text.inverse} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>


                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                        onPress={() => router.push('/programs/generate')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                            <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.actionTitle, { color: colors.text.primary }]}>AI Generate</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.text.tertiary }]}>Smart plans</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                        onPress={() => router.push('/programs/explore')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 45, 85, 0.1)' }]}>
                            <Ionicons name="compass" size={24} color="#FF2D55" />
                        </View>
                        <Text style={[styles.actionTitle, { color: colors.text.primary }]}>Explore</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.text.tertiary }]}>Find plans</Text>
                    </TouchableOpacity>
                </View>

                {/* Create New Button */}
                <TouchableOpacity
                    style={[styles.createBanner, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                    onPress={() => router.push('/programs/create')}
                >
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 122, 255, 0.1)', marginBottom: 0 }]}>
                        <Ionicons name="create" size={24} color="#007AFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={[styles.actionTitle, { color: colors.text.primary, marginBottom: 2 }]}>Create Custom Routine</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.text.tertiary }]}>Build your own workout</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
                </TouchableOpacity>

                {/* Quick Start Feature */}
                <TouchableOpacity
                    style={[
                        styles.quickStartBanner,
                        { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                        activeWorkout && styles.disabledAction
                    ]}
                    onPress={() => handleStartWorkout(null)}
                    disabled={!!activeWorkout}
                >
                    <LinearGradient
                        colors={[colors.accent.primary + '20', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />
                    <View style={[styles.actionIcon, { backgroundColor: colors.accent.primary + '20', marginBottom: 0 }]}>
                        <Ionicons name="flash" size={24} color={colors.accent.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={[styles.actionTitle, { color: colors.text.primary, marginBottom: 2 }]}>Quick Start</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.text.tertiary }]}>Start an empty workout now</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
                </TouchableOpacity>

                {/* My Routines Section */}
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>My Routines</Text>

                {
                    displayedItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="fitness-outline" size={64} color={colors.text.disabled} />
                            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No routines yet</Text>
                            <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
                                Create a routine to track your progress efficiently.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={displayedItems}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.type === 'program' ? `prog-${item.id}` : `rout-${item.data.id}`}
                            scrollEnabled={false}
                            contentContainerStyle={styles.listContainer}
                            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                        />
                    )
                }
            </ScrollView>

            {/* Program Details Modal */}
            <Modal
                visible={!!selectedProgram}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    if (isSelectionMode) {
                        setSelectedRoutineIds(new Set());
                    } else {
                        setSelectedProgram(null);
                    }
                }}
            >
                <View style={[styles.programModalContainer, { backgroundColor: colors.background.primary }]}>
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { backgroundColor: colors.background.elevated }]}>
                        {isSelectionMode ? (
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <TouchableOpacity onPress={() => setSelectedRoutineIds(new Set())}>
                                    <Text style={{ color: colors.text.secondary, fontSize: 16 }}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={[styles.modalTitle, { color: colors.text.primary, fontSize: 18 }]}>
                                    {selectedRoutineIds.size} Selected
                                </Text>
                                <TouchableOpacity onPress={handleBulkDelete}>
                                    <Ionicons name="trash" size={24} color={colors.status.error} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                                        {selectedProgram?.name}
                                    </Text>
                                    <Text style={[styles.modalSubtitle, { color: colors.text.tertiary }]}>
                                        {modalRoutines.length} Workouts
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.closeButton, { backgroundColor: colors.background.card }]}
                                    onPress={() => setSelectedProgram(null)}
                                >
                                    <Ionicons name="close" size={24} color={colors.text.primary} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {modalRoutines.map((routine, index) => (
                            <View key={routine.id} style={{ marginBottom: 16 }}>
                                {renderRoutineData(routine, undefined, true)}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            < Modal
                visible={!!deleteId}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteId(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.confirmModal, { backgroundColor: colors.background.elevated }]}>
                        <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>Delete Routine?</Text>
                        <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
                            Are you sure you want to delete this routine? This action cannot be undone.
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.background.card }]}
                                onPress={() => setDeleteId(null)}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.accent.warning }]}
                                onPress={confirmDelete}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal >

            {/* Delete Program Confirmation Modal */}
            <Modal
                visible={!!deleteProgramId}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteProgramId(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.confirmModal, { backgroundColor: colors.background.elevated }]}>
                        <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>Delete Program?</Text>
                        <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
                            Are you sure you want to delete this entire program? All workouts within it will be removed.
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.background.card }]}
                                onPress={() => setDeleteProgramId(null)}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.accent.warning }]}
                                onPress={handleConfirmDeleteProgram}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>Delete Program</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: spacing.xl,
        paddingBottom: 120, // Space for banner
    },
    quickActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xxl,
    },
    actionCard: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    disabledAction: {
        opacity: 0.5,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 12,
    },
    quickStartBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.xxl,
        overflow: 'hidden',
    },
    createBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
    },
    listContainer: {
        paddingBottom: spacing.xl,
    },
    card: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    miniIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 13,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startBtn: {
        flex: 1,
        height: 36,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    startBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
        opacity: 0.7,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: spacing.lg,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 250,
    },
    activeBannerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: 'rgba(150,150,150,0.1)',
    },
    activeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    activeBannerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    activeBannerSubtitle: {
        fontSize: 12,
        opacity: 0.9,
    },
    activeBannerButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    confirmModal: {
        width: '100%',
        padding: spacing.xl,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.sm,
    },
    confirmText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 20,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    // New Styles for Programs
    officialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        gap: 4
    },
    officialText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5
    },
    programDeleteBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8
    },
    programModalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150,150,150,0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});


