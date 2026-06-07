import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StatusBar, Image, Animated , Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../../src/store/useUserStore';
import { useNutritionStore } from '../../src/store/useNutritionStore';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useProgressStore } from '../../src/store/useProgressStore';
import { useHealthConnectStore } from '../../src/store/useHealthConnectStore';
import { useNotesStore } from '../../src/store/useNotesStore';
import { useTheme } from '../../src/store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../../src/constants/theme';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths, isAfter, startOfDay } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { MuscleVisualizerCard } from '../../src/components/MuscleVisualizerCard';
import useMuscleStore from '../../src/store/useMuscleStore';
import MuscleRepository from '../../src/repositories/MuscleRepository';
import { useAuthStore } from '../../src/store/useAuthStore';
import { DashboardHeader } from '../../src/components/dashboard/DashboardHeader';
import { GamificationWidget } from '../../src/components/dashboard/GamificationWidget';
import { TutorialOverlay } from '../../src/components/dashboard/TutorialOverlay';
import { DASHBOARD_TOUR_STEPS } from '../../src/components/dashboard/DashboardTutorialOverlay';
import { TourHighlightWrapper } from '../../src/components/dashboard/TourHighlightWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalorieCalculator } from '../../src/components/CalorieCalculator';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  usernameText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
  },
  profileBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 2,
  },
  avatarContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  activeWorkoutCard: {
    marginBottom: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.md,
  },
  activeGradient: {
    padding: spacing.lg,
  },
  activeWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activeRoutine: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  notebookCard: {
    marginTop: -spacing.md,
    marginBottom: spacing.xl,
    borderRadius: 24,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  notebookIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notebookTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 3,
  },
  notebookMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainCard: {
    padding: spacing.lg,
    borderRadius: 24,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  calorieInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  calorieMain: {
    fontSize: 32,
    fontWeight: '900',
  },
  calorieGoal: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroText: {
    fontSize: 12,
    fontWeight: '600',
  },
  smallCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 20,
    justifyContent: 'center',
    ...shadows.sm,
  },
  smallLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  smallValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: 30,
  },
  heroActionBtn: {
    flex: 1,
    height: 140,
    borderRadius: 28,
    padding: spacing.lg,
    justifyContent: 'space-between',
    ...shadows.md,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityFeed: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  activityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 12,
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  activityVolume: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  activityDuration: {
    fontSize: 12,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  calendarWrapper: {
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayLabel: {
    width: (width - spacing.xl * 2 - 16) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  calendarDay: {
    width: (width - spacing.xl * 2 - 16) / 7,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 4,
    paddingTop: 4,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '700',
  },
  calendarWeightTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  calendarWeightText: {
    fontSize: 9,
    fontWeight: '800',
  },

  weightInputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weightInput: {
    fontSize: 48,
    fontWeight: '900',
    borderBottomWidth: 2,
    minWidth: 120,
    paddingBottom: 4,
  },
  unitLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  saveBtn: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default function Dashboard() {
  const { user, loadUser } = useUserStore();
  const { totals, loadLogs: loadNutrition } = useNutritionStore();
  const { activeWorkout, history, streak, loadRoutines: loadWorkouts, loadHistory, loadStreak, exercises } = useWorkoutStore();
  const { measurements, loadMeasurements, addMeasurement } = useProgressStore();
  const notebookItems = useNotesStore((s) => s.items);
  const { user: authUser } = useAuthStore();
  const muscleStore = useMuscleStore();
  const { getMuscleGroupsForExercise } = require('@/services/muscleCalculationService');
  
  const liveMuscleData = React.useMemo(() => {
    // Start with persisted data from the store
    const merged = new Map(muscleStore.muscleData);

    // Apply weekly baseline colors (faded) for muscles worked recently but not today
    muscleStore.weeklyData.forEach((volumes: number[], muscle: any) => {
        const weeklyVolume = volumes.reduce((a, b) => a + b, 0);
        if (weeklyVolume > 0 && !merged.has(muscle)) {
            const intensity = Math.min(10, weeklyVolume / 100);
            merged.set(muscle, {
                group: muscle, volume: 0, setCount: 0, repCount: 0, 
                intensity, 
                soreness: 0, recoveryStatus: 'FRESH', 
                lastTrainedDate: new Date().toISOString(), restDaysSince: 0, 
                color: muscleStore.getMuscleColor(muscle, intensity, 0)
            });
        }
    });

    // Add LIVE data from the current active workout session (immediate feedback)
    if (activeWorkout?.activeSets && activeWorkout.activeSets.length > 0) {
        const completedSets = activeWorkout.activeSets.filter((s: any) => s.completed && Number(s.reps) > 0);
        
        completedSets.forEach((setData: any) => {
            const ex = exercises.find((e: any) => e.id === setData.exerciseId);
            const muscles = getMuscleGroupsForExercise(setData.exerciseName || ex?.name || '', ex?.muscleGroup || '');
            const volume = (Number(setData.weight) || 0) * (Number(setData.reps) || 0);
            
            muscles.forEach((muscle: any) => {
                const existing = merged.get(muscle) || {
                    group: muscle, volume: 0, setCount: 0, repCount: 0, intensity: 0, soreness: 0,
                    recoveryStatus: 'FRESH', lastTrainedDate: new Date().toISOString(),
                    restDaysSince: 0, color: '#64748b'
                };
                
                const newVolume = existing.volume + volume;
                merged.set(muscle, {
                    ...existing,
                    volume: newVolume,
                    setCount: existing.setCount + 1,
                    repCount: existing.repCount + (Number(setData.reps) || 0),
                    intensity: Math.min(10, Math.max(existing.intensity, newVolume / 50)),
                    color: muscleStore.getMuscleColor(muscle, Math.min(10, newVolume / 50), existing.soreness)
                });
            });
        });
    }
    return merged;
  }, [muscleStore.muscleData, muscleStore.weeklyData, activeWorkout, exercises]);

  const {
    todaySteps,
    isAvailable: isHealthConnectAvailable,
    hasStepPermission,
    isLoading: isHealthConnectLoading,
    bootstrap: bootstrapHealthConnect,
    connectAndSync,
    openHealthConnectApp,
  } = useHealthConnectStore();
  const { colors, mode } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  useEffect(() => {
    const checkTutorial = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('@has_seen_dashboard_tour_v5');
        if (!hasSeen) {
          setTimeout(() => {
            setIsTourVisible(true);
            setTourStep(1);
          }, 1200);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkTutorial();
  }, []);

  const handleStepChange = (nextStep: number) => {
    setTourStep(nextStep);
    
    // Scroll targets matching the actual top-to-bottom layout order:
    // Step 1: Header (no scroll needed, it's above the ScrollView)
    // Step 2: Stats Row (top of ScrollView)
    // Step 3: Muscle Visualizer (below stats ~250px)
    // Step 4: Quick Actions (below visualizer ~550px)
    // Step 5: Activity Feed (near bottom ~550px)
    const scrollTargets = [0, 0, 150, 380, 550];
    const targetY = scrollTargets[nextStep - 1];
    
    scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
  };

  const finishTour = async () => {
    setIsTourVisible(false);
    await AsyncStorage.setItem('@has_seen_dashboard_tour_v5', 'true');
  };


  const [refreshing, setRefreshing] = useState(false);
  const [muscleLoading, setMuscleLoading] = useState(false);
  const [showWeightLog, setShowWeightLog] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [hasUsedCalculator, setHasUsedCalculator] = useState(false);
  const [showCalcSuccessMessage, setShowCalcSuccessMessage] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weightInput, setWeightInput] = useState('');
  const [elapsedTime, setElapsedTime] = useState('0:00');

  useEffect(() => {
    const checkCalc = async () => {
      try {
        const calcUsed = await AsyncStorage.getItem('@has_used_calculator');
        if (calcUsed === 'true') {
          setHasUsedCalculator(true);
        }
      } catch (e) {}
    };
    checkCalc();
  }, [user]);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Timer logic for active workout
  useEffect(() => {
    if (!activeWorkout) return;

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setElapsedTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Pulse animation for live badge
  useEffect(() => {
    if (activeWorkout) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [activeWorkout]);

  // Pre-fill weight if it exists when date changes
  useEffect(() => {
    const existing = measurements.find(m => isSameDay(new Date(m.date), selectedDate));
    if (existing) {
      setWeightInput(existing.weight.toString());
    } else {
      setWeightInput('');
    }
  }, [selectedDate, measurements]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    bootstrapHealthConnect();
  }, []);

  const loadData = async () => {
    await loadUser();
    await Promise.all([loadNutrition(), loadWorkouts(), loadHistory(10), loadMeasurements(), loadStreak()]);
    // Load muscle data for dashboard widget
    if (user?.id) {
      try {
        setMuscleLoading(true);
        const userIdStr = String(user.id);
        const todayStats = await MuscleRepository.getTodaysMuscleStats(userIdStr);
        const weeklyStats = await MuscleRepository.getWeeklyMuscleStats(userIdStr);
        
        // Ensure we don't clear the store with empty data if there was already something there
        if (todayStats.size > 0 || muscleStore.muscleData.size === 0) {
            muscleStore.setMuscleData(todayStats);
        }
        if (weeklyStats.size > 0 || muscleStore.weeklyData.size === 0) {
            muscleStore.setWeeklyData(weeklyStats);
        }
      } catch (err) {
        console.error("Dashboard failed to load muscle data", err);
      } finally {
        setMuscleLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const lastWorkout = history && history.length > 0 ? history[0] : null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const calorieProgress = useMemo(() => {
    if (!user?.calorieGoal) return 0;
    return Math.min(totals.calories / user.calorieGoal, 1);
  }, [totals.calories, user?.calorieGoal]);

  // Generate week progress
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, []);

  const activeDaySet = useMemo(() => new Set(streak.activeDays), [streak.activeDays]);

  const getWorkoutOnDay = (day: Date) => {
    return activeDaySet.has(format(day, 'yyyy-MM-dd'));
  };

  const latestWeight = useMemo(() => {
    return measurements[0]?.weight || user?.weight || '--';
  }, [measurements, user?.weight]);



  const handleSaveWeight = async () => {
    if (!weightInput) return;
    if (isAfter(startOfDay(selectedDate), startOfDay(new Date()))) {
      alert("You cannot log weight for future dates.");
      return;
    }
    await addMeasurement({ weight: parseFloat(weightInput) }, selectedDate.toISOString());
    setWeightInput('');
    setShowWeightLog(false);
    await loadUser(); // Update user weight in profile if needed
  };

  const renderCalendar = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({
      start: startOfWeek(start, { weekStartsOn: 0 }),
      end: endOfWeek(end, { weekStartsOn: 0 })
    });

    return (
      <View style={styles.calendarGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <Text key={idx} style={[styles.calendarDayLabel, { color: colors.text.tertiary }]}>{d}</Text>
        ))}
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
          const measurement = measurements.find(m => isSameDay(new Date(m.date), day));

          return (
            <TouchableOpacity
              key={idx}
              disabled={isFuture}
              style={[
                styles.calendarDay,
                isSelected && { backgroundColor: colors.accent.primary },
                isFuture && { opacity: 0.3 }
              ]}
              onPress={() => setSelectedDate(day)}
            >
              <Text style={[
                styles.calendarDayText,
                { color: isCurrentMonth ? colors.text.primary : colors.text.disabled },
                isSelected && { color: 'white' },
                isFuture && { color: colors.text.disabled }
              ]}>
                {format(day, 'd')}
              </Text>
              {measurement && (
                <View style={[
                  styles.calendarWeightTag,
                  {
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : colors.accent.success + '15',
                    borderColor: isSelected ? 'white' : colors.accent.success + '30',
                    borderWidth: 1
                  }
                ]}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.calendarWeightText,
                      { color: isSelected ? 'white' : colors.accent.success }
                    ]}
                  >
                    W {measurement.weight}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      <TourHighlightWrapper isActive={isTourVisible && tourStep === 1} borderRadius={40}>
        <DashboardHeader user={user} streak={streak} greeting={greeting()} />
      </TourHighlightWrapper>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Session Callout */}
        {activeWorkout && (
          <TouchableOpacity
            style={styles.activeWorkoutCard}
            onPress={() => router.push('/workout/active')}
          >
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.secondary]}
              style={styles.activeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.activeWorkoutContent}>
                <View style={[styles.activeIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="barbell" size={24} color="white" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                      {elapsedTime}
                    </Text>
                    <View style={styles.liveBadge}>
                      <Animated.View
                        style={[
                          styles.liveDot,
                          {
                            opacity: pulseAnim || 1
                          }
                        ]}
                      />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  </View>
                  <Text style={styles.activeRoutine} numberOfLines={1}>{activeWorkout.routineName}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' }}>
                    Tap to resume workout
                  </Text>
                </View>

                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'white',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="play" size={20} color={colors.accent.primary} style={{ marginLeft: 3 }} />
                </View>
              </View>

              {/* Background abstract shapes for premium feel */}
              <View style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }} />
              <View style={{
                position: 'absolute',
                bottom: -20,
                left: -20,
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Statistics and Insights Section */}

        {/* Calorie Calculator Promo Banner */}
        {!hasUsedCalculator && (
          <View style={{ marginBottom: 24, paddingHorizontal: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: -10, zIndex: 2, marginLeft: 16 }}>
              <Ionicons name="sparkles" size={12} color="white" />
              <Text style={{ color: 'white', fontSize: 10, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase' }}>Action Required</Text>
            </View>
            <TouchableOpacity
              style={[{
                flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20, borderRadius: 20, 
                borderWidth: 1, gap: 14,
                backgroundColor: colors.background.card, borderColor: colors.accent.primary + '50',
                ...shadows.sm
              }]}
              onPress={() => setShowCalculator(true)}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent.primary + '15' }}>
                <Ionicons name="calculator-outline" size={20} color={colors.accent.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontWeight: '800', fontSize: 15 }}>Set Your Calories</Text>
                <Text style={{ color: colors.text.tertiary, fontWeight: '500', fontSize: 12, marginTop: 2 }}>Use it here to test your calorie requirements and set it for the whole application.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.disabled} />
            </TouchableOpacity>
          </View>
        )}

        {hasUsedCalculator && showCalcSuccessMessage && (
          <View style={{ marginBottom: 24, padding: 16, borderRadius: 16, backgroundColor: colors.accent.success + '15', borderWidth: 1, borderColor: colors.accent.success + '30', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="checkmark-circle" size={24} color={colors.accent.success} />
            <Text style={{ color: colors.text.primary, fontSize: 13, flex: 1, fontWeight: '500' }}>
              Goals set! If you ever need to use it again, you can find it in the Profile page.
            </Text>
          </View>
        )}

        {/* Main Stats Row */}
        <TourHighlightWrapper isActive={isTourVisible && tourStep === 2} borderRadius={24}>
          <View style={styles.statsRow}>
          {/* Nutrition Summary */}
          <TouchableOpacity
            style={[styles.mainCard, { backgroundColor: colors.background.card, flex: 1.2 }]}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text.secondary }]}>NUTRITION</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </View>
            <View style={styles.calorieInfo}>
              <Text style={[styles.calorieMain, { color: colors.text.primary }]}>
                {Math.round(totals.calories)}
              </Text>
              <Text style={[styles.calorieGoal, { color: colors.text.tertiary }]}>
                / {user?.calorieGoal || 2000} kcal
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${calorieProgress * 100}%`,
                    backgroundColor: colors.accent.secondary
                  }
                ]}
              />
            </View>

            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.nutrition.protein }]} />
                <Text style={[styles.macroText, { color: colors.text.tertiary }]}>{Math.round(totals.protein)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.nutrition.carbs }]} />
                <Text style={[styles.macroText, { color: colors.text.tertiary }]}>{Math.round(totals.carbs)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.nutrition.fats }]} />
                <Text style={[styles.macroText, { color: colors.text.tertiary }]}>{Math.round(totals.fats)}g</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Last Workout Box */}
          <View style={{ gap: spacing.md, flex: 1 }}>
            <TouchableOpacity
              style={[styles.smallCard, { backgroundColor: colors.background.card }]}
              onPress={() => router.push('/(tabs)/history')}
            >
              <Ionicons name="barbell" size={24} color={colors.accent.primary} style={{ marginBottom: 4 }} />
              <Text style={[styles.smallLabel, { color: colors.text.tertiary }]}>Last Lift</Text>
              <Text style={[styles.smallValue, { color: colors.text.primary }]} numberOfLines={1}>
                {lastWorkout?.routineName || 'None'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallCard, { backgroundColor: colors.background.card }]}
              onPress={() => setShowWeightLog(true)}
            >
              <Ionicons name="speedometer" size={24} color={colors.accent.success} style={{ marginBottom: 4 }} />
              <Text style={[styles.smallLabel, { color: colors.text.tertiary }]}>Weight Monitor</Text>
              <Text style={[styles.smallValue, { color: colors.text.primary }]}>
                {latestWeight} kg
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </TourHighlightWrapper>



        {/* Muscle Visualizer Widget - Stats reflect DONE sessions only */}
        <TourHighlightWrapper isActive={isTourVisible && tourStep === 3} borderRadius={24}>
          <MuscleVisualizerCard
            muscleData={muscleStore.muscleData} 
            loading={muscleLoading}
            onPress={() => router.push('/muscles' as any)}
            todaysExercises={muscleStore.todaysExercises}
          />
        </TourHighlightWrapper>

        {/* Action Buttons */}
        <TourHighlightWrapper isActive={isTourVisible && tourStep === 4} borderRadius={20}>
          <View style={styles.actionGrid}>

          <TouchableOpacity
            style={[styles.heroActionBtn, { backgroundColor: colors.background.card }]}
            onPress={() => {
              router.push('/(tabs)/routines');
              if (isTourVisible && tourStep === 4) {
                setTimeout(() => handleStepChange(5), 400);
              }
            }}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <Ionicons name="barbell" size={24} color="#3B82F6" />
            </View>
            <View>
              <Text style={[styles.actionBtnLabel, { color: colors.text.primary, fontSize: 14 }]}>Start Workout</Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                 Pick a routine
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroActionBtn, { backgroundColor: colors.background.card }]}
            onPress={() => router.push('/nutrition/add')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
              <Ionicons name="restaurant" size={24} color="#EC4899" />
            </View>
            <View>
              <Text style={[styles.actionBtnLabel, { color: colors.text.primary, fontSize: 14 }]}>Log Meal</Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                 Track calories
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        </TourHighlightWrapper>

        {/* Recent Activity Feed */}
        <TourHighlightWrapper isActive={isTourVisible && tourStep === 5} borderRadius={24}>
          <View style={styles.activityFeed}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Progress Feed</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={{ color: colors.accent.primary, fontWeight: '600' }}>See All</Text>
            </TouchableOpacity>
          </View>

          {history.slice(0, 7).map((log, idx) => (
            <TouchableOpacity
              key={log.id}
              style={[styles.activityItem, { borderBottomColor: colors.border.secondary }]}
              onPress={() => router.push({ pathname: '/workout/summary', params: { id: log.id } })}
            >
              <View style={[styles.activityIconBox, { backgroundColor: idx % 2 === 0 ? colors.accent.primary + '10' : colors.accent.secondary + '10' }]}>
                <Ionicons
                  name={idx % 2 === 0 ? "fitness" : "flame"}
                  size={20}
                  color={idx % 2 === 0 ? colors.accent.primary : colors.accent.secondary}
                />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityName, { color: colors.text.primary }]}>
                  {log.routineName || 'Quick Workout'}
                </Text>
                <Text style={[styles.activityMeta, { color: colors.text.tertiary }]}>
                  {format(new Date(log.date), 'EEEE • h:mm a')}
                </Text>
              </View>
              <View style={styles.activityStats}>
                <Text style={[styles.activityVolume, { color: colors.text.primary }]}>
                  {((log.volume || 0) / 1000).toFixed(1)}k kg
                </Text>
                <Text style={[styles.activityDuration, { color: colors.text.tertiary }]}>
                  {log.duration}m
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {history.length === 0 && (
            <View style={styles.emptyActivity}>
              <Ionicons name="calendar-outline" size={48} color={colors.text.disabled} />
              <Text style={{ color: colors.text.disabled, marginTop: 12 }}>No recent activity found</Text>
            </View>
          )}
        </View>
        </TourHighlightWrapper>


      </ScrollView>

      {/* Weight Log Modal */}
      <Modal
        visible={showWeightLog}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWeightLog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Log Weight</Text>
              <TouchableOpacity onPress={() => setShowWeightLog(false)}>
                <Ionicons name="close" size={28} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.calendarWrapper}>
                <View style={styles.calendarHeader}>
                  <Text style={[styles.monthText, { color: colors.text.primary }]}>
                    {format(selectedDate, 'MMMM yyyy')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={() => setSelectedDate(subMonths(selectedDate, 1))}>
                      <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedDate(addMonths(selectedDate, 1))}>
                      <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                {renderCalendar()}
              </View>

              <View style={styles.weightInputSection}>
                <Text style={[styles.inputLabel, { color: colors.text.tertiary }]}>
                  Weight for {format(selectedDate, 'MMM d, yyyy')}
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.weightInput, { color: colors.text.primary, borderBottomColor: colors.accent.primary }]}
                    placeholder="00.0"
                    placeholderTextColor={colors.text.disabled}
                    keyboardType="numeric"
                    value={weightInput}
                    onChangeText={setWeightInput}
                    autoFocus
                  />
                  <Text style={[styles.unitLabel, { color: colors.text.tertiary }]}>kg</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.accent.primary }]}
                onPress={handleSaveWeight}
              >
                <Text style={styles.saveBtnText}>Save Measurement</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* High-Fidelity Custom Tutorial Overlay */}
      <TutorialOverlay
        isVisible={isTourVisible}
        step={tourStep}
        steps={DASHBOARD_TOUR_STEPS}
        onStepChange={handleStepChange}
        onFinish={finishTour}
      />

      {/* Calorie Calculator Modal */}
      <CalorieCalculator
          visible={showCalculator}
          onClose={() => setShowCalculator(false)}
          initialValues={{
              weight: user?.weight,
              height: user?.height,
              age: user?.age,
              gender: user?.gender,
              activityLevel: user?.activityLevel,
              goal: user?.goal,
              bodyFatPercent: user?.bodyFatPercent,
              sleepHours: user?.sleepHours,
              mealsPerDay: user?.mealsPerDay,
              goalIntensity: user?.goalIntensity,
              workoutType: user?.workoutType,
              workoutDuration: user?.workoutDuration,
              workoutFrequency: user?.workoutFrequency
          }}
          onSave={async (results) => {
              try {
                  if (user) {
                      await useUserStore.getState().updateProfile({
                          ...user,
                          weight: results.weight,
                          height: results.height,
                          age: results.age,
                          gender: results.gender,
                          activityLevel: results.activityLevel as any,
                          goal: results.goal,
                          calorieGoal: results.calories,
                          targetProtein: results.protein,
                          targetCarbs: results.carbs,
                          targetFats: results.fats,
                      });
                      await useUserStore.getState().loadUser();
                  }
                  setShowCalculator(false);
                  setHasUsedCalculator(true);
                  setShowCalcSuccessMessage(true);
                  await AsyncStorage.setItem('@has_used_calculator', 'true');
                  setTimeout(() => setShowCalcSuccessMessage(false), 5 * 60 * 1000);
              } catch (error) {
                  console.error('Failed to update profile:', error);
              }
          }}
      />

      </View>
  );
}
