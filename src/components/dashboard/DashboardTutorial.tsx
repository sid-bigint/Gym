import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';
import { spacing, borderRadius, shadows } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const TUTORIAL_KEY = '@has_seen_dashboard_tutorial';

interface TutorialStep {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to your Dashboard!',
    description: 'This is your central hub for fitness. Let\'s take a quick tour of what you can do here.',
    icon: 'home',
    color: '#3B82F6', // Blue
  },
  {
    title: 'Track Your Nutrition',
    description: 'Monitor your daily calories and macros (protein, carbs, fats) at a glance.',
    icon: 'restaurant',
    color: '#EC4899', // Pink
  },
  {
    title: 'Muscle Visualizer',
    description: 'See which muscles are recovered and which need rest with the interactive body map.',
    icon: 'body',
    color: '#8B5CF6', // Purple
  },
  {
    title: 'Live Workouts & History',
    description: 'Resume active sessions instantly and review your past lifting progress.',
    icon: 'barbell',
    color: '#22C55E', // Green
  },
  {
    title: 'Log Your Weight',
    description: 'Keep your body measurements up to date easily with the quick weight monitor.',
    icon: 'speedometer',
    color: '#F59E0B', // Amber
  },
];

export const DashboardTutorial = () => {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  const checkTutorialStatus = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem(TUTORIAL_KEY);
      if (!hasSeen) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await finishTutorial();
    }
  };

  const finishTutorial = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
      setIsVisible(false);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={finishTutorial}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.background.primary }]}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  { backgroundColor: index === currentStep ? colors.accent.primary : colors.border.primary },
                  index === currentStep && styles.progressDotActive
                ]}
              />
            ))}
          </View>

          {/* Icon Area */}
          <LinearGradient
            colors={[step.color, step.color + '80']}
            style={styles.iconContainer}
          >
            <Ionicons name={step.icon} size={64} color="white" />
          </LinearGradient>

          {/* Text Content */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {step.title}
          </Text>
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            {step.description}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={finishTutorial}
            >
              <Text style={[styles.skipText, { color: colors.text.tertiary }]}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.accent.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.nextText}>
                {currentStep === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              {currentStep < TUTORIAL_STEPS.length - 1 && (
                <Ionicons name="arrow-forward" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    width: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  skipButton: {
    padding: spacing.md,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
    ...shadows.sm,
  },
  nextText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
