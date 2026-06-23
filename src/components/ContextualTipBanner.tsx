import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useTheme';

interface ContextualTipBannerProps {
    tipKey: string;
    message: string;
    icon: string;
    accentColor?: string;
}

export function ContextualTipBanner({ tipKey, message, icon, accentColor }: ContextualTipBannerProps) {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    const translateY = useRef(new Animated.Value(-64)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const storageKey = `@tip_seen_${tipKey}`;

    const hide = () => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -64, duration: 220, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(() => setVisible(false));
        AsyncStorage.setItem(storageKey, '1');
    };

    useEffect(() => {
        let mounted = true;
        let showTimer: ReturnType<typeof setTimeout>;
        let autoTimer: ReturnType<typeof setTimeout>;

        AsyncStorage.getItem(storageKey).then(seen => {
            if (seen || !mounted) return;
            showTimer = setTimeout(() => {
                if (!mounted) return;
                setVisible(true);
                Animated.parallel([
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 60 }),
                    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                ]).start();
                autoTimer = setTimeout(() => { if (mounted) hide(); }, 5000);
            }, 1000);
        });

        return () => {
            mounted = false;
            clearTimeout(showTimer);
            clearTimeout(autoTimer);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!visible) return null;

    const accent = accentColor ?? colors.accent.primary;

    return (
        <Animated.View style={[
            styles.banner,
            {
                backgroundColor: colors.background.elevated,
                borderColor: colors.border.primary,
                transform: [{ translateY }],
                opacity,
            },
        ]}>
            <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
                <Ionicons name={icon as any} size={16} color={accent} />
            </View>
            <Text style={[styles.message, { color: colors.text.secondary }]} numberOfLines={2}>
                {message}
            </Text>
            <TouchableOpacity onPress={hide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={15} color={colors.text.tertiary} />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    iconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    message: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '500',
    },
});
