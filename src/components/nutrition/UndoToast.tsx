import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, PanResponder } from 'react-native';
import { useTheme } from '../../store/useTheme';

interface UndoToastProps {
    visible: boolean;
    message: string;
    onUndo: () => void;
    onDismiss: () => void;
    duration?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({ 
    visible, 
    message, 
    onUndo, 
    onDismiss, 
    duration = 5000 
}) => {
    const { colors } = useTheme();
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (visible) {
            show();
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(hide, duration);
        } else {
            hide();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible]);

    const show = () => {
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true })
        ]).start();
    };

    const hide = () => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: 100, duration: 250, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
        ]).start(() => {
            if (visible) onDismiss();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 40) {
                    hide();
                } else {
                    show();
                }
            },
        })
    ).current;

    if (!visible) return null;

    return (
        <Animated.View 
            style={[
                styles.container, 
                { 
                    backgroundColor: colors.background.elevated, 
                    transform: [{ translateY }],
                    opacity
                }
            ]}
            {...panResponder.panHandlers}
        >
            <Text style={[styles.message, { color: colors.text.primary }]}>{message}</Text>
            <TouchableOpacity onPress={onUndo} style={styles.undoBtn}>
                <Text style={[styles.undoText, { color: colors.accent.primary }]}>UNDO</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 130,
        left: 20,
        right: 20,
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 1000,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    undoBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    undoText: {
        fontSize: 14,
        fontWeight: 'bold',
    }
});
