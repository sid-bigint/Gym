import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StatusBar, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../../src/store/useUserStore';
import { useNutritionStore } from '../../src/store/useNutritionStore';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useProgressStore } from '../../src/store/useProgressStore';
import { useTheme } from '../../src/store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../../src/constants/theme';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths, isAfter, startOfDay } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, TextInput } from 'react-native';

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
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dayDotCompleted: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  dayDotEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dayDotToday: {
    borderColor: 'white',
    borderWidth: 3,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
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
  const { activeWorkout, history, loadRoutines: loadWorkouts, loadHistory } = useWorkoutStore();
  const { measurements, loadMeasurements, addMeasurement } = useProgressStore();
  const { colors, mode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showWeightLog, setShowWeightLog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weightInput, setWeightInput] = useState('');
  const [elapsedTime, setElapsedTime] = useState('0:00');

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

  const loadData = async () => {
    await Promise.all([loadUser(), loadNutrition(), loadWorkouts(), loadHistory(10), loadMeasurements()]);
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

  const getWorkoutOnDay = (day: Date) => {
    return history.find(h => isSameDay(new Date(h.date), day));
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

      {/* Immersive Header */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={[colors.accent.primary, mode === 'dark' ? '#4C1D95' : colors.accent.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>{greeting()},</Text>
              <Text style={styles.usernameText}>{user?.name?.split(' ')[0] || 'Athlete'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => router.push('/(tabs)/routines')}
              >
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.headerActionText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileBtn}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <View style={styles.avatarContainer}>
                  {user?.picture ? (
                    <Image source={{ uri: user.picture }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                  ) : (
                    <Image
                      key={user?.gender}
                      source={{
                        uri: (user?.gender?.toLowerCase() === 'female')
                          ? 'https://cdn-icons-png.flaticon.com/512/6997/6997662.png' // Female Avatar
                          : 'https://cdn-icons-png.flaticon.com/512/236/236831.png'   // Male Avatar
                      }}
                      style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#ddd' }}
                      resizeMode="cover"
                    />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekly Streak/Activity */}
          <View style={styles.weekContainer}>
            {weekDays.map((day, idx) => {
              const workout = getWorkoutOnDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <View key={idx} style={styles.dayColumn}>
                  <Text style={[styles.dayLabel, { opacity: isToday ? 1 : 0.6 }]}>
                    {format(day, 'EE').charAt(0)}
                  </Text>
                  <View style={[
                    styles.dayDot,
                    workout ? styles.dayDotCompleted : styles.dayDotEmpty,
                    isToday && styles.dayDotToday
                  ]}>
                    {workout && <Ionicons name="checkmark" size={12} color="white" />}
                  </View>
                </View>
              );
            })}
          </View>
        </LinearGradient>
      </View>

      <ScrollView
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

        {/* Main Stats Row */}
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

        {/* Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.heroActionBtn, { backgroundColor: colors.background.card }]}
            onPress={() => { }}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              <Ionicons name="water" size={24} color="#0EA5E9" />
            </View>
            <View>
              <Text style={[styles.actionBtnLabel, { color: colors.text.primary, fontSize: 14 }]}>Water Intake</Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 12, fontWeight: '600' }}>2.5 / 3.0 L</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroActionBtn, { backgroundColor: colors.background.card }]}
            onPress={() => router.push('/nutrition/add')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
              <Ionicons name="restaurant" size={24} color="#EC4899" />
            </View>
            <Text style={[styles.actionBtnLabel, { color: colors.text.primary }]}>Log Meal</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Feed */}
        <View style={styles.activityFeed}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Progress Feed</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={{ color: colors.accent.primary, fontWeight: '600' }}>See All</Text>
            </TouchableOpacity>
          </View>

          {history.slice(0, 5).map((log, idx) => (
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
    </View>
  );
}
