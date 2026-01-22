import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, ImageBackground } from 'react-native';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
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
    const [selectedProgram, setSelectedProgram] = useState<{ id: string, name: string, routines: any[], bundle?: any } | null>(null);

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
        Object.keys(groups).forEach(pid => {
            // Import PREDEFINED_BUNDLES dynamically or require it on top. 
            // Since we can't easily add top-level imports in a replace block if not careful, 
            // ensure we rely on the file having it or we add it. 
            // Wait, I need to add the import to 'PREDEFINED_BUNDLES' at the top of the file too.
            // For now, I'll access it if I imported it. I'll add the import in a separate edit or assume it's there? 
            // No, I must add it. I will do a separate edit for imports first or combine.
            // I'll assume I'll add the import in this same file replacement or previous.
            // Actually, I can use require inside useMemo if needed, but better to import.
            const bundle = PREDEFINED_BUNDLES.find((b: any) => b.id === pid);
            result.push({
                type: 'program',
                id: pid,
                name: bundle ? bundle.name : 'Unknown Program',
                routines: groups[pid],
                bundle: bundle
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
            Alert.alert(
                "Workout in Progress",
                "You already have an active workout. Finish it first or cancel to start a new one.",
                [
                    { text: "OK", style: "cancel" },
                    { text: "Go to Active", onPress: () => router.push('/workout/active') }
                ]
            );
            return;
        }

        try {
            await startWorkout(routineId);
            // Close modal if open
            setSelectedProgram(null);
            router.push('/workout/active');
        } catch (e) {
            Alert.alert("Error", "Failed to start workout");
        }
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
    const renderRoutineData = (item: any, styleOverride?: any) => (
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary }, styleOverride]}>
            <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                    <View style={[styles.miniIcon, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                        <Ionicons name="barbell" size={14} color={colors.accent.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>{item.name}</Text>
                        <Text style={[styles.cardSubtitle, { color: colors.text.secondary }]}>
                            {item.exercises?.length || 0} Exercises
                        </Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
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
        </View>
    );

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
                <View style={[styles.officialBadge, { alignSelf: 'flex-start', marginBottom: 'auto' }]}>
                    <Ionicons name="albums" size={12} color="#fff" />
                    <Text style={styles.officialText}>PROGRAM</Text>
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
                        onPress={() => router.push('/programs/explore')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 45, 85, 0.1)' }]}>
                            <Ionicons name="compass" size={24} color="#FF2D55" />
                        </View>
                        <Text style={[styles.actionTitle, { color: colors.text.primary }]}>Explore</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.text.tertiary }]}>Find plans</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                        onPress={() => router.push('/programs/create')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
                            <Ionicons name="create" size={24} color="#007AFF" />
                        </View>
                        <Text style={[styles.actionTitle, { color: colors.text.primary }]}>Create New</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.text.tertiary }]}>Custom</Text>
                    </TouchableOpacity>
                </View>

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
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
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
            </ScrollView >

            {/* Program Details Modal */}
            <Modal
                visible={!!selectedProgram}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedProgram(null)}
            >
                <View style={[styles.programModalContainer, { backgroundColor: colors.background.primary }]}>
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { backgroundColor: colors.background.elevated }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                                {selectedProgram?.name}
                            </Text>
                            <Text style={[styles.modalSubtitle, { color: colors.text.tertiary }]}>
                                {selectedProgram?.routines.length} Workouts
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: colors.background.card }]}
                            onPress={() => setSelectedProgram(null)}
                        >
                            <Ionicons name="close" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {selectedProgram?.routines.map((routine, index) => (
                            <View key={routine.id} style={{ marginBottom: 16 }}>
                                {renderRoutineData(routine)}
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


