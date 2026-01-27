import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useAlertStore } from '../store/useAlertStore';
import { useTheme } from '../store/useTheme';
import { borderRadius, spacing, shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

export const GlobalAlert = () => {
    const { visible, title, message, buttons, hideAlert } = useAlertStore();
    const { colors } = useTheme();

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={hideAlert}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={[styles.alertContainer, { backgroundColor: colors.background.elevated, borderColor: colors.border.primary, borderWidth: 1 }]}>
                    <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
                    {message ? <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text> : null}

                    <View style={[styles.buttonContainer, { marginTop: spacing.lg }]}>
                        {buttons.map((btn, index) => {
                            const isDestructive = btn.style === 'destructive';
                            const isCancel = btn.style === 'cancel';
                            // Default is primary
                            const isPrimary = !isDestructive && !isCancel;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        isCancel && { backgroundColor: colors.background.secondary },
                                        isDestructive && { backgroundColor: colors.status.error + '15' }, // 15 = roughly 10% opacity hex
                                        isPrimary && { backgroundColor: colors.accent.primary },
                                    ]}
                                    onPress={() => {
                                        hideAlert();
                                        if (btn.onPress) btn.onPress();
                                    }}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        isCancel && { color: colors.text.primary },
                                        isDestructive && { color: colors.status.error },
                                        isPrimary && { color: colors.text.inverse }
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)', // Darker overlay for better focus
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    alertContainer: {
        width: Math.min(width * 0.85, 360),
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.9,
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.md,
        width: '100%',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: borderRadius.lg,
        minWidth: '45%', // Ensure 2 buttons fit side-by-side
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    }
});
