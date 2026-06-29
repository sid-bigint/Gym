import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Dimensions } from 'react-native';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useAlertStore } from '../../src/store/useAlertStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/store/useTheme';
import { useScreenPadding } from '../../src/store/useScreenPadding';
import { spacing, borderRadius, shadows } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { PREDEFINED_BUNDLES } from '../../src/data/exploreBundles';
import { RoutineCard } from '../../src/components/RoutineCard';
import { ProgramCard } from '../../src/components/ProgramCard';
import { LogPastWorkoutModal } from '../../src/components/routines/LogPastWorkoutModal';
import { TutorialOverlay, TourStepConfig } from '../../src/components/dashboard/TutorialOverlay';
import { TourHighlightWrapper } from '../../src/components/dashboard/TourHighlightWrapper';
import { ContextualTipBanner } from '../../src/components/ContextualTipBanner';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RoutinesScreen() {
    const { routines, routineAnalytics, loadRoutines, isLoading, startWorkout, activeWorkout, deleteRoutine, togglePinRoutine } = useWorkoutStore();
    const { colors } = useTheme();
    const { contentTop } = useScreenPadding();
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteProgramId, setDeleteProgramId] = useState<string | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<{ id: string, name: string, routines: any[], bundle?: any } | null>(null);
    const [selectedRoutineIds, setSelectedRoutineIds] = useState<Set<number>>(new Set());
    const [showPastLogModal, setShowPastLogModal] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;
    const fabAnim = useRef(new Animated.Value(0)).current;
    const fabOpenAnim = useRef(new Animated.Value(0)).current;
    const [greeting, setGreeting] = useState('');
    const scrollRef = useRef<any>(null);

    // ─── Tutorial State ───
    const [isTourVisible, setIsTourVisible] = useState(false);
    const [tourStep, setTourStep] = useState(1);

    const ROUTINES_TOUR_STEPS: TourStepConfig[] = [
        {
            title: 'Routines Overview',
            description: 'This is where all your workout routines live. You can see your total routines count in the top-right badge.',
            icon: 'barbell',
        },
        {
            title: 'Quick Stats',
            description: 'See how many routines you\'ve completed and how many you have in total at a glance.',
            icon: 'stats-chart',
        },
        {
            title: 'Quick Start',
            description: 'Tap this banner to instantly begin a freestyle workout without picking a routine.',
            icon: 'flash',
        },
        {
            title: 'Your Routine Cards',
            description: 'Each card is a workout routine. Tap to start, long-press to select multiple, swipe to pin or delete.',
            icon: 'list',
        },
        {
            title: 'The Create Menu',
            description: 'The + button opens a menu with multiple ways to create workouts.',
            icon: 'add-circle',
            placement: 'top',
        },
        {
            title: 'AI & Custom Routines',
            description: 'Use the AI generator to instantly build a personalized plan, or create your own custom workout from scratch.',
            icon: 'hardware-chip',
            placement: 'top',
        },
        {
            title: 'Log Past Workouts',
            description: 'Forgot to track a workout? You can easily log a past session here to keep your progress history accurate.',
            icon: 'time',
            placement: 'top',
        },
    ];

    useEffect(() => {
        const checkTour = async () => {
            try {
                const seen = await AsyncStorage.getItem('@has_seen_routines_tour_v1');
                if (!seen) {
                    setTimeout(() => {
                        setIsTourVisible(true);
                        setTourStep(1);
                    }, 800);
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkTour();
    }, []);

    const handleTourStepChange = (nextStep: number) => {
        setTourStep(nextStep);
        const scrollTargets = [0, 0, 50, 200, 0, 0, 0];
        const targetY = scrollTargets[nextStep - 1] || 0;
        scrollRef.current?.scrollTo?.({ y: targetY, animated: true });
        scrollRef.current?.getNode?.()?.scrollTo?.({ y: targetY, animated: true });

        if (nextStep >= 5) {
            setFabOpen(true);
        } else {
            setFabOpen(false);
        }
    };

    const finishTour = async () => {
        setIsTourVisible(false);
        setFabOpen(false);
        await AsyncStorage.setItem('@has_seen_routines_tour_v1', 'true');
    };

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning ☀️');
        else if (hour < 18) setGreeting('Good afternoon 🌤️');
        else setGreeting('Good evening 🌙');
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.spring(fabAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const isSelectionMode = selectedRoutineIds.size > 0;

    const toggleSelection = useCallback((id: number) => {
        const newSet = new Set(selectedRoutineIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedRoutineIds(newSet);
    }, [selectedRoutineIds]);

    const handleBulkDelete = useCallback(async () => {
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
    }, [selectedRoutineIds, deleteRoutine]);

    // Group routines by program
    const displayedItems = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        const standaloneRoutines: any[] = [];

        routines.forEach(r => {
            if (r.programId) {
                if (!groups[r.programId]) groups[r.programId] = [];
                groups[r.programId].push(r);
            } else {
                standaloneRoutines.push(r);
            }
        });

        const result: any[] = [];
        const usedImages = new Set<string>();

        const pinned = standaloneRoutines.filter(r => r.isPinned).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        if (pinned.length > 0) {
            result.push({ type: 'section_header', title: '📌 Pinned', icon: 'pin' });
            pinned.forEach(r => result.push({ type: 'routine', data: r }));
        }

        const uncategorized = standaloneRoutines.filter(r => !r.isPinned).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        if (uncategorized.length > 0) {
            result.push({ type: 'section_header', title: '💪 All Routines', icon: 'fitness' });
            uncategorized.forEach(r => result.push({ type: 'routine', data: r }));
        }

        const programKeys = Object.keys(groups);
        if (programKeys.length > 0) {
            result.push({ type: 'section_header', title: '📚 Programs', icon: 'albums' });
        }

        programKeys.forEach(pid => {
            const bundle = PREDEFINED_BUNDLES.find((b: any) => b.id === pid);
            let name = 'Unknown Program';
            let programBundle = bundle;

            if (pid.startsWith('ai|') || pid.startsWith('ai-')) {
                if (pid.startsWith('ai|')) {
                    const parts = pid.split('|');
                    name = parts[1] || 'AI Workout Plan';
                } else {
                    name = 'AI Generated Plan';
                }

                if (!programBundle) {
                    const charSum = pid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const hue = charSum % 360;
                    let selectedImage = null;
                    const allImages: string[] = [];

                    try {
                        const programRoutines = groups[pid] || [];
                        programRoutines.forEach(routine => {
                            if (routine.exercises) {
                                routine.exercises.forEach((re: any) => {
                                    if (re.exercise?.images?.length > 0) {
                                        re.exercise.images.forEach((img: string) => {
                                            if (typeof img === 'string' && img.length > 0) {
                                                allImages.push(img);
                                            }
                                        });
                                    }
                                });
                            }
                        });

                        if (allImages.length > 0) {
                            const unusedImages = allImages.filter(img => !usedImages.has(img));
                            const pool = unusedImages.length > 0 ? unusedImages : allImages;
                            const index = charSum % pool.length;
                            selectedImage = pool[index];
                            usedImages.add(selectedImage);
                        }
                    } catch (e) { }

                    programBundle = {
                        id: pid,
                        name: name,
                        description: 'Custom AI Plan',
                        gradient: [
                            `hsl(${hue}, 70%, 45%)`,
                            `hsl(${(hue + 45) % 360}, 75%, 35%)`
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

        return result;
    }, [routines]);

    useFocusEffect(useCallback(() => {
        loadRoutines();
        setFabOpen(false);
        Animated.timing(fabOpenAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
        Animated.spring(fabAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
    }, []));

    const handleStartWorkout = useCallback(async (routineId: number | null) => {
        if (activeWorkout) {
            useAlertStore.getState().showAlert(
                "Workout in Progress",
                "You already have an active workout.",
                [
                    { text: "OK", style: "cancel" },
                    { text: "Go to Active", onPress: () => router.push('/workout/active') }
                ]
            );
            return;
        }

        try {
            await startWorkout(routineId);
            setSelectedProgram(null);
            router.push('/workout/active');
        } catch (e) {
            useAlertStore.getState().showAlert("Error", "Failed to start workout");
        }
    }, [activeWorkout, startWorkout]);

    const handleConfirmDeleteProgram = useCallback(async () => {
        if (!deleteProgramId) return;
        const programRoutines = routines.filter(r => r.programId === deleteProgramId);
        for (const r of programRoutines) {
            await deleteRoutine(r.id);
        }
        setDeleteProgramId(null);
        setSelectedProgram(null);
    }, [deleteProgramId, routines, deleteRoutine]);

    const confirmDelete = useCallback(async () => {
        if (deleteId) {
            await deleteRoutine(deleteId);
            setDeleteId(null);
        }
    }, [deleteId, deleteRoutine]);

    const handleFabAction = useCallback((action: string) => {
        setFabOpen(false);
        Animated.timing(fabOpenAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start();
        setTimeout(() => {
            switch (action) {
                case 'ai':
                    router.push('/programs/generate');
                    break;
                case 'explore':
                    router.push('/programs/explore');
                    break;
                case 'custom':
                    router.push('/programs/create');
                    break;
                case 'import':
                    router.push('/routines/import');
                    break;
                case 'log':
                    setShowPastLogModal(true);
                    break;
            }
        }, 100);
    }, []);

    const renderItem = useCallback(({ item }: { item: any }) => {
        if (item.type === 'section_header') {
            return (
                <View style={styles.sectionHeaderContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{item.title}</Text>
                    <View style={[styles.sectionLine, { backgroundColor: colors.border.primary }]} />
                </View>
            );
        }

        if (item.type === 'program') {
            return (
                <View style={styles.listContainer}>
                    <ProgramCard
                        item={item}
                        onSelect={setSelectedProgram}
                        onDelete={setDeleteProgramId}
                    />
                </View>
            );
        }
        return (
            <View style={styles.listContainer}>
                <RoutineCard
                    item={item.data}
                    analytics={routineAnalytics[item.data.name]}
                    isSelectable={true}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedRoutineIds.has(item.data.id)}
                    onToggleSelection={toggleSelection}
                    onDelete={setDeleteId}
                    onPin={togglePinRoutine}
                    onStartWorkout={handleStartWorkout}
                />
            </View>
        );
    }, [colors, routineAnalytics, isSelectionMode, selectedRoutineIds, toggleSelection, handleStartWorkout, togglePinRoutine]);

    const modalRoutines = React.useMemo(() => {
        if (!selectedProgram) return [];
        return routines.filter(r => r.programId === selectedProgram.id);
    }, [routines, selectedProgram]);

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const fabScale = fabAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
    });

    const fabRotate = fabOpenAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            {/* Animated Header */}
            <TourHighlightWrapper isActive={isTourVisible && tourStep === 1} borderRadius={24}>
                <Animated.View style={[styles.header, { opacity: headerOpacity, paddingTop: contentTop }]}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.text.secondary }]}>{greeting}</Text>
                        <Text style={[styles.title, { color: colors.text.primary }]}>Your Workouts</Text>
                    </View>
                    <View style={styles.headerStats}>
                        <View style={[styles.statBadge, { backgroundColor: colors.accent.primary + '15' }]}>
                            <Ionicons name="barbell-outline" size={16} color={colors.accent.primary} />
                            <Text style={[styles.statText, { color: colors.accent.primary }]}>{routines.length}</Text>
                        </View>
                    </View>
                </Animated.View>
            </TourHighlightWrapper>

            {/* Contextual tip: shown once when user has routines */}
            {routines.length > 0 && (
                <ContextualTipBanner
                    tipKey="routines_longpress"
                    message="Long-press any routine to select multiple and bulk delete"
                    icon="hand-left-outline"
                />
            )}

            {/* Main Content */}
            <Animated.FlatList
                ref={scrollRef}
                data={isSelectionMode ? displayedItems.filter(item => item.type === 'routine' || item.type === 'program') : displayedItems}
                keyExtractor={(item: any, index: number) => `select-${item.type}-${item.data?.id || item.id || index}`}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews={true}
                ListHeaderComponent={
                    <>
                        {/* Quick Stats Row */}
                        {!isSelectionMode && routines.length > 0 && (
                            <TourHighlightWrapper isActive={isTourVisible && tourStep === 2} borderRadius={16}>
                                <View style={styles.statsRow}>
                                    <View style={[styles.statCard, { backgroundColor: colors.background.elevated }]}>
                                        <LinearGradient
                                            colors={[colors.accent.primary + '20', colors.accent.primary + '05']}
                                            style={styles.statCardGradient}
                                        >
                                            <Ionicons name="calendar-outline" size={24} color={colors.accent.primary} />
                                            <Text style={[styles.statValue, { color: colors.text.primary }]}>
                                                {routines.filter(r => routineAnalytics[r.name]?.lastPerformed).length}
                                            </Text>
                                            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Completed</Text>
                                        </LinearGradient>
                                    </View>
                                    <View style={[styles.statCard, { backgroundColor: colors.background.elevated }]}>
                                        <LinearGradient
                                            colors={[colors.accent.primary + '20', colors.accent.primary + '05']}
                                            style={styles.statCardGradient}
                                        >
                                            <Ionicons name="flame-outline" size={24} color={colors.accent.primary} />
                                            <Text style={[styles.statValue, { color: colors.text.primary }]}>
                                                {routines.length}
                                            </Text>
                                            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Total Routines</Text>
                                        </LinearGradient>
                                    </View>
                                </View>
                            </TourHighlightWrapper>
                        )}

                        {/* Empty State */}
                        {!isSelectionMode && routines.length === 0 && (
                            <View style={styles.emptyStateContainer}>
                                <LinearGradient
                                    colors={[colors.accent.primary + '20', colors.accent.primary + '05']}
                                    style={styles.emptyStateGradient}
                                >
                                    <View style={styles.emptyStateIconContainer}>
                                        <Ionicons name="fitness" size={80} color={colors.accent.primary} />
                                    </View>
                                    <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>No workouts yet</Text>
                                    <Text style={[styles.emptyStateSubtitle, { color: colors.text.secondary }]}>
                                        Create your first workout to start tracking
                                    </Text>
                                    <View style={styles.emptyStateActions}>
                                        <TouchableOpacity
                                            style={[styles.emptyStateButton, { backgroundColor: '#8B5CF6' }]}
                                            onPress={() => router.push('/programs/generate')}
                                        >
                                            <Ionicons name="sparkles" size={20} color="#fff" />
                                            <Text style={styles.emptyStateButtonText}>AI Generate</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.emptyStateButton, { backgroundColor: '#007AFF' }]}
                                            onPress={() => router.push('/programs/create')}
                                        >
                                            <Ionicons name="create" size={20} color="#fff" />
                                            <Text style={styles.emptyStateButtonText}>Custom</Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </View>
                        )}

                        {/* Quick Start Banner - Enhanced */}
                        {!isSelectionMode && routines.length > 0 && (
                            <TourHighlightWrapper isActive={isTourVisible && tourStep === 3} borderRadius={16}>
                                <TouchableOpacity
                                    style={[
                                        styles.quickStartBanner,
                                        { opacity: activeWorkout ? 0.5 : 1 }
                                    ]}
                                    onPress={() => handleStartWorkout(null)}
                                    disabled={!!activeWorkout}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[colors.accent.primary, colors.accent.secondary || colors.accent.primary]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.quickStartGradient}
                                    >
                                        <View style={styles.quickStartContent}>
                                            <View style={styles.quickStartIconContainer}>
                                                <Ionicons name="flash" size={28} color="#fff" />
                                            </View>
                                            <View style={styles.quickStartTextContainer}>
                                                <Text style={styles.quickStartTitle}>Quick Start</Text>
                                                <Text style={styles.quickStartSubtitle}>
                                                    {activeWorkout ? 'Workout in progress' : 'Start a session now'}
                                                </Text>
                                            </View>
                                            <View style={styles.quickStartArrow}>
                                                <Ionicons name="arrow-forward" size={24} color="#fff" />
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </TourHighlightWrapper>
                        )}
                    </>
                }
            />

            {/* Floating Action Button */}
            {!isSelectionMode && (
                <TourHighlightWrapper isActive={isTourVisible && tourStep === 5} borderRadius={40}>
                    <View style={styles.fabContainer}>
                        <Animated.View style={[styles.fabMenu, { transform: [{ scale: fabScale }] }]}>
                            {fabOpen && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.fabAction, { backgroundColor: '#8B5CF6' }]}
                                        onPress={() => handleFabAction('ai')}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#8B5CF6', '#7C3AED']}
                                            style={styles.fabActionGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Ionicons name="sparkles" size={22} color="#fff" />
                                            <Text style={styles.fabActionLabel}>AI Generate</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.fabAction, { backgroundColor: '#FF2D55' }]}
                                        onPress={() => handleFabAction('explore')}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#FF2D55', '#FF0A3D']}
                                            style={styles.fabActionGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Ionicons name="compass" size={22} color="#fff" />
                                            <Text style={styles.fabActionLabel}>Explore</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.fabAction, { backgroundColor: '#007AFF' }]}
                                        onPress={() => handleFabAction('custom')}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#007AFF', '#0051D5']}
                                            style={styles.fabActionGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Ionicons name="create" size={22} color="#fff" />
                                            <Text style={styles.fabActionLabel}>Custom</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    {/* HIDING IMPORT FEATURE FOR NOW 
                                    <TouchableOpacity
                                        style={[styles.fabAction, { backgroundColor: '#F59E0B' }]}
                                        onPress={() => handleFabAction('import')}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#F59E0B', '#D97706']}
                                            style={styles.fabActionGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Ionicons name="document-text" size={22} color="#fff" />
                                            <Text style={styles.fabActionLabel}>Import Bulk</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    */}
                                    <TouchableOpacity
                                        style={[styles.fabAction, { backgroundColor: '#10B981' }]}
                                        onPress={() => handleFabAction('log')}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#10B981', '#059669']}
                                            style={styles.fabActionGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Ionicons name="calendar" size={22} color="#fff" />
                                            <Text style={styles.fabActionLabel}>Log Past</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            )}
                        </Animated.View>

                        <TouchableOpacity
                            style={[styles.fab, { backgroundColor: colors.accent.primary }]}
                            onPress={() => {
                                const next = !fabOpen;
                                setFabOpen(next);
                                Animated.spring(fabOpenAnim, { toValue: next ? 1 : 0, useNativeDriver: true, friction: 6, tension: 50 }).start();
                            }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[colors.accent.primary, colors.accent.secondary || colors.accent.primary]}
                                style={styles.fabGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
                                    <Ionicons name="add" size={28} color="#fff" />
                                </Animated.View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </TourHighlightWrapper>
            )}

            {/* Modals remain the same */}
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

                    <FlatList
                        data={modalRoutines}
                        keyExtractor={(routine) => routine.id.toString()}
                        contentContainerStyle={{ padding: 20 }}
                        initialNumToRender={5}
                        maxToRenderPerBatch={5}
                        windowSize={3}
                        removeClippedSubviews={true}
                        renderItem={({ item: routine }) => (
                            <View style={{ marginBottom: 16 }}>
                                <RoutineCard
                                    item={routine}
                                    analytics={routineAnalytics[routine.name]}
                                    isSelectable={true}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedRoutineIds.has(routine.id)}
                                    onToggleSelection={toggleSelection}
                                    onDelete={setDeleteId}
                                    onPin={togglePinRoutine}
                                    onStartWorkout={handleStartWorkout}
                                />
                            </View>
                        )}
                    />
                </View>
            </Modal>

            <Modal
                visible={!!deleteId}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteId(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.confirmModal, { backgroundColor: colors.background.elevated }]}>
                        <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>Delete Routine?</Text>
                        <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
                            This action cannot be undone.
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
            </Modal>

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
                            All workouts in this program will be removed.
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

            <LogPastWorkoutModal
                visible={showPastLogModal}
                onClose={() => {
                    setShowPastLogModal(false);
                    loadRoutines();
                }}
            />

            {/* Routines Tutorial Overlay */}
            <TutorialOverlay
                isVisible={isTourVisible}
                step={tourStep}
                steps={ROUTINES_TOUR_STEPS}
                onStepChange={handleTourStepChange}
                onFinish={finishTour}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    greeting: {
        fontSize: 14,
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
    },
    headerStats: {
        flexDirection: 'row',
        gap: 8,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    statCardGradient: {
        padding: spacing.md,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    sectionLine: {
        flex: 1,
        height: 1,
        opacity: 0.2,
    },
    listContainer: {
        paddingHorizontal: spacing.xl,
        gap: 12,
    },
    emptyStateContainer: {
        marginHorizontal: spacing.xl,
        marginVertical: spacing.xl,
    },
    emptyStateGradient: {
        padding: spacing.xl,
        borderRadius: 24,
        alignItems: 'center',
    },
    emptyStateIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    emptyStateActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    emptyStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 30,
        gap: 8,
    },
    emptyStateButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    quickStartBanner: {
        marginHorizontal: spacing.xl,
        marginBottom: spacing.xl,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    quickStartGradient: {
        padding: 4,
    },
    quickStartContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    quickStartIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickStartTextContainer: {
        flex: 1,
    },
    quickStartTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    quickStartSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
    },
    quickStartArrow: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        alignItems: 'flex-end',
    },
    fabMenu: {
        alignItems: 'flex-end',
        marginBottom: 16,
        gap: 12,
    },
    fabAction: {
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    fabActionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    fabActionLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    fabGradient: {
        flex: 1,
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
        borderRadius: 24,
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
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
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