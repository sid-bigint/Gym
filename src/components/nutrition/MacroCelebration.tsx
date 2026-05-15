import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/useTheme';

interface MacroCelebrationProps {
    visible: boolean;
    message: string;
    onComplete: () => void;
}

export const MacroCelebration: React.FC<MacroCelebrationProps> = ({ visible, message, onComplete }) => {
    const { colors } = useTheme();
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (visible) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            Animated.parallel([
                Animated.spring(translateY, { toValue: 60, useNativeDriver: true, friction: 6 }),
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 })
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, { toValue: -100, duration: 500, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })
                ]).start(() => onComplete());
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View 
            style={[
                styles.container, 
                { 
                    backgroundColor: colors.background.elevated, 
                    transform: [{ translateY }, { scale }],
                    opacity,
                    borderColor: colors.accent.primary
                }
            ]}
        >
            <View style={[styles.iconBox, { backgroundColor: colors.accent.primary }]}>
                <Ionicons name="trophy" size={20} color="#fff" />
            </View>
            <Text style={[styles.message, { color: colors.text.primary }]}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderWidth: 2,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        zIndex: 2000,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    message: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    }
});
