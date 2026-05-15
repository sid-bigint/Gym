import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';

const { width, height } = Dimensions.get('window');

interface EnhancedFABProps {
    onQuickLog: () => void;
    onWizard: () => void;
    onCopyYesterday: () => void;
    onBarcodePress: () => void;
}

export const EnhancedFAB: React.FC<EnhancedFABProps> = ({ onQuickLog, onWizard, onCopyYesterday, onBarcodePress }) => {
    const { colors } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;
        
        // Clear existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        Animated.spring(animation, {
            toValue,
            friction: 5,
            useNativeDriver: true,
        }).start();

        setIsOpen(!isOpen);

        // Set auto-dismiss timer if opening
        if (!isOpen) {
            timerRef.current = setTimeout(() => {
                if (isOpen) toggleMenu(); // This might have stale isOpen, so better use a ref or check state correctly
            }, 5000);
        }
    };

    // Correct way to handle auto-dismiss with latest state
    useEffect(() => {
        if (isOpen) {
            timerRef.current = setTimeout(() => {
                closeMenu();
            }, 5000);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isOpen]);

    const closeMenu = () => {
        Animated.spring(animation, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
        }).start();
        setIsOpen(false);
    };

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const getActionStyle = (index: number) => ({
        transform: [
            { scale: animation },
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -70 * (index + 1)],
                }),
            },
        ],
        opacity: animation,
    });

    return (
        <View style={styles.fullScreenContainer} pointerEvents="box-none">
            {isOpen && (
                <Pressable 
                    style={styles.backdrop} 
                    onPress={closeMenu}
                />
            )}
            
            <View style={styles.fabContainer} pointerEvents="box-none">
                <Animated.View 
                    pointerEvents={isOpen ? 'auto' : 'none'}
                    style={[styles.actionBtn, getActionStyle(3), { backgroundColor: colors.background.elevated, opacity: 0.6 }]}
                >
                    <TouchableOpacity onPress={onBarcodePress} style={styles.actionInner}>
                        <View style={styles.actionLabelContainer}>
                            <Text style={[styles.actionLabel, { color: colors.text.primary, backgroundColor: colors.background.card }]}>Scan Barcode</Text>
                            <View style={[styles.soonBadge, { backgroundColor: colors.accent.warning }]}>
                                <Text style={styles.soonText}>SOON</Text>
                            </View>
                        </View>
                        <Ionicons name="barcode-outline" size={20} color={colors.text.disabled} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View 
                    pointerEvents={isOpen ? 'auto' : 'none'}
                    style={[styles.actionBtn, getActionStyle(2), { backgroundColor: colors.background.elevated }]}
                >
                    <TouchableOpacity onPress={() => { onCopyYesterday(); closeMenu(); }} style={styles.actionInner}>
                        <Text style={[styles.actionLabel, { color: colors.text.primary, backgroundColor: colors.background.card }]}>Copy Yesterday</Text>
                        <Ionicons name="copy-outline" size={20} color={colors.accent.primary} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View 
                    pointerEvents={isOpen ? 'auto' : 'none'}
                    style={[styles.actionBtn, getActionStyle(1), { backgroundColor: colors.background.elevated }]}
                >
                    <TouchableOpacity onPress={() => { onWizard(); closeMenu(); }} style={styles.actionInner}>
                        <Text style={[styles.actionLabel, { color: colors.text.primary, backgroundColor: colors.background.card }]}>Full Wizard</Text>
                        <Ionicons name="list-outline" size={20} color={colors.accent.primary} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View 
                    pointerEvents={isOpen ? 'auto' : 'none'}
                    style={[styles.actionBtn, getActionStyle(0), { backgroundColor: colors.background.elevated }]}
                >
                    <TouchableOpacity onPress={() => { onQuickLog(); closeMenu(); }} style={styles.actionInner}>
                        <Text style={[styles.actionLabel, { color: colors.text.primary, backgroundColor: colors.background.card }]}>Quick Search</Text>
                        <Ionicons name="search-outline" size={20} color={colors.accent.primary} />
                    </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity 
                    onPress={toggleMenu} 
                    style={[styles.mainBtn, { backgroundColor: colors.accent.primary }]}
                    activeOpacity={0.8}
                >
                    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                        <Ionicons name="add" size={32} color={colors.text.inverse} />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        alignItems: 'center',
    },
    mainBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    actionBtn: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    actionInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    actionLabel: {
        position: 'absolute',
        right: 60,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 'bold',
        overflow: 'hidden',
        minWidth: 100,
        textAlign: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    actionLabelContainer: {
        position: 'absolute',
        right: 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    soonBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: -10,
        zIndex: 1,
    },
    soonText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#fff',
    }
});
