import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';

interface SwipeTabWrapperProps {
  children: React.ReactNode;
  nextRoute?: string;
  prevRoute?: string;
}

const { width } = Dimensions.get('window');

/**
 * Wraps page content and allows horizontal swiping to navigate between tabs.
 */
export const SwipeTabWrapper: React.FC<SwipeTabWrapperProps> = ({ children, nextRoute, prevRoute }) => {
  const panResponder = useRef(
    PanResponder.create({
      // Only claim the responder if the swipe is clearly horizontal
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 40 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const swipeThreshold = width * 0.35; // 35% of screen width

        if (gestureState.dx > swipeThreshold && prevRoute) {
          // Swiped right -> go to previous
          router.replace(prevRoute as any);
        } else if (gestureState.dx < -swipeThreshold && nextRoute) {
          // Swiped left -> go to next
          router.replace(nextRoute as any);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
