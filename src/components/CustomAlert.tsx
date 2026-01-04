import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

export const CustomAlert = () => {
    const { isVisible, title, message, buttons, hideAlert } = useAlert();
    const { colors } = useTheme();
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.9));

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={hideAlert}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.alertContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                            backgroundColor: colors.background.elevated,
                            borderColor: colors.border.secondary,
                        },
                    ]}
                >
                    <View style={styles.content}>
                        {/* Optional formatting based on title keywords */}
                        <View style={[styles.iconContainer, { backgroundColor: title.toLowerCase().includes('error') ? 'rgba(239, 68, 68, 0.1)' : title.toLowerCase().includes('success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
                            <Ionicons
                                name={title.toLowerCase().includes('error') ? 'alert-circle' : title.toLowerCase().includes('success') ? 'checkmark-circle' : 'information-circle'}
                                size={32}
                                color={title.toLowerCase().includes('error') ? '#EF4444' : title.toLowerCase().includes('success') ? '#10B981' : colors.accent.primary}
                            />
                        </View>

                        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
                        {message && <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text>}
                    </View>

                    <View style={[styles.buttonContainer, { borderTopColor: colors.border.secondary }]}>
                        {buttons.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                style={[
                                    styles.button,
                                    index > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border.secondary },
                                    btn.style === 'destructive' && { backgroundColor: 'transparent' },
                                    btn.style === 'cancel' && { backgroundColor: 'transparent' },
                                ]}
                                onPress={() => {
                                    hideAlert();
                                    if (btn.onPress) btn.onPress();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        {
                                            color:
                                                btn.style === 'destructive'
                                                    ? '#EF4444'
                                                    : btn.style === 'cancel'
                                                        ? colors.text.tertiary
                                                        : colors.accent.primary,
                                            fontWeight: btn.style === 'cancel' ? '500' : '700',
                                        },
                                    ]}
                                >
                                    {btn.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    alertContainer: {
        width: Math.min(width * 0.85, 340),
        borderRadius: 24,
        borderWidth: 1,
        ...shadows.lg,
        overflow: 'hidden',
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        height: 56,
    },
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
    },
});
