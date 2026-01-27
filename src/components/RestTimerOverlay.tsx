import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../constants/theme';

interface RestTimerOverlayProps {
    visible: boolean;
    duration: number;
    onClose: () => void;
    onAddSeconds: (seconds: number) => void;
}

const { width } = Dimensions.get('window');

export const RestTimerOverlay = ({ visible, duration, onClose, onAddSeconds }: RestTimerOverlayProps) => {
    const { colors } = useTheme();
    const [timeLeft, setTimeLeft] = useState(duration);
    const progressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            setTimeLeft(duration);
            progressAnim.setValue(1);
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: duration * 1000,
                useNativeDriver: false // width doesn't support native driver
            }).start();
        }
    }, [visible, duration]);

    useEffect(() => {
        if (!visible) return;

        if (timeLeft <= 0) {
            onClose();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [visible, timeLeft]);

    if (!visible) return null;

    const formatTime = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: colors.background.elevated }]}>
                {/* Progress Bar Background */}
                <View style={[styles.progressBg, { backgroundColor: colors.background.secondary }]}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                backgroundColor: colors.accent.primary + '30', // Transparent primary
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                })
                            }
                        ]}
                    />
                </View>

                <View style={styles.content}>
                    <View style={styles.left}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>REST</Text>
                        <Text style={[styles.timer, { color: colors.text.primary }]}>{formatTime(timeLeft)}</Text>
                    </View>

                    <View style={styles.controls}>
                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                            onPress={() => onAddSeconds(30)}
                        >
                            <Text style={[styles.btnText, { color: colors.text.primary }]}>+30s</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.skipBtn, { backgroundColor: colors.accent.primary }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.skipText, { color: colors.text.inverse }]}>Skip</Text>
                            <Ionicons name="play-skip-forward" size={16} color={colors.text.inverse} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 1000,
    },
    card: {
        width: '100%',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        ...shadows.lg,
    },
    progressBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    progressFill: {
        height: '100%',
    },
    content: {
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    left: {
        flex: 1,
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 2,
    },
    timer: {
        fontSize: 28,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    controls: {
        flexDirection: 'row',
        gap: 10,
    },
    btn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    skipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    skipText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
