import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';
import { spacing } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');

export interface TourStepConfig {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  placement?: 'top' | 'bottom' | 'center';
  interactive?: boolean;
  actionLabel?: string;
}

interface TutorialOverlayProps {
  isVisible: boolean;
  step: number;
  steps: TourStepConfig[];
  onStepChange: (step: number) => void;
  onFinish: () => void;
}

/**
 * Reusable tutorial overlay card.
 * Renders a card with step info, progress dots, and Next/Skip buttons.
 * Supports interactive mode where the user must perform an action to proceed.
 */
export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isVisible,
  step,
  steps,
  onStepChange,
  onFinish,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Animate in/out
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 40,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  // Subtle bounce on step change
  useEffect(() => {
    if (isVisible) {
      slideAnim.setValue(15);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [step]);

  const handleNext = () => {
    if (step < steps.length) {
      onStepChange(step + 1);
    } else {
      onFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      onStepChange(step - 1);
    }
  };

  if (!isVisible || step < 1 || step > steps.length) return null;

  const current = steps[step - 1];
  const isInteractive = !!current.interactive;
  const isDark = colors.background.primary === '#000000' || colors.background.primary === '#080A0C';

  // Determine card position
  const getCardPosition = () => {
    if (current.placement === 'top') {
      return { top: insets.top + 16 };
    }
    if (current.placement === 'center') {
      return { top: '35%' as any };
    }
    // default: bottom
    return { bottom: insets.bottom + 16 };
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dimmed backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, isInteractive ? 0.3 : 0.5],
            }),
          },
        ]}
        pointerEvents="none"
      />

      {/* Card */}
      <Animated.View
        style={[
          styles.cardWrapper,
          getCardPosition(),
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: current.placement === 'top'
                  ? slideAnim.interpolate({ inputRange: [0, 40], outputRange: [0, -40] })
                  : slideAnim,
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          {/* Icon + Title Row */}
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent.primary + '18' }]}>
              <Ionicons name={current.icon} size={16} color={colors.accent.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
                {current.title}
              </Text>
              <Text style={[styles.stepCounter, { color: colors.text.disabled }]}>
                {step}/{steps.length}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.desc, { color: isDark ? '#ccc' : '#555' }]}>
            {current.description}
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.accent.primary,
                  width: `${(step / steps.length) * 100}%`,
                },
              ]}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onFinish} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.skipText, { color: colors.text.disabled }]}>Skip</Text>
            </TouchableOpacity>

            {isInteractive ? (
              <View style={[styles.hintBadge, { backgroundColor: colors.accent.primary + '15' }]}>
                <Ionicons name="hand-left" size={13} color={colors.accent.primary} />
                <Text style={[styles.hintText, { color: colors.accent.primary }]}>
                  {current.actionLabel || 'Tap to continue'}
                </Text>
              </View>
            ) : (
              <View style={styles.navButtons}>
                {step > 1 && (
                  <TouchableOpacity
                    onPress={handleBack}
                    style={[styles.backBtn, { borderColor: isDark ? '#444' : '#DDD' }]}
                  >
                    <Ionicons name="chevron-back" size={16} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
                  <LinearGradient
                    colors={[colors.accent.primary, colors.accent.secondary || colors.accent.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.nextBtn}
                  >
                    <Text style={styles.nextText}>
                      {step === steps.length ? "Done" : 'Next'}
                    </Text>
                    {step < steps.length && (
                      <Ionicons name="chevron-forward" size={14} color="white" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  cardWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  card: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  nextText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
  },
  hintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
