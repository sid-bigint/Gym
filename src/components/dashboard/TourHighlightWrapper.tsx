import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../store/useTheme';

interface TourHighlightWrapperProps {
  isActive: boolean;
  children: React.ReactNode;
  borderRadius?: number;
}

export const TourHighlightWrapper: React.FC<TourHighlightWrapperProps> = ({
  isActive,
  children,
  borderRadius = 24,
}) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Fade in border
      Animated.timing(borderOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      // Loop pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.98,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Fade out border
      Animated.timing(borderOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  return (
    <View style={[styles.container, { zIndex: isActive ? 9999 : 1 }]}>
      {isActive && (
        <Animated.View
          style={[
            styles.glowAura,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius,
              opacity: pulseAnim.interpolate({ inputRange: [0.95, 1.05], outputRange: [0.15, 0.35] }),
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0.95, 1.05], outputRange: [1, 1.1] }) }],
            },
          ]}
          pointerEvents="none"
        />
      )}
      {children}
      {isActive && (
        <Animated.View
          style={[
            styles.glowBorder,
            {
              borderColor: colors.accent.primary,
              borderRadius: borderRadius,
              opacity: borderOpacity,
              shadowColor: colors.accent.primary,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glowAura: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
});
