import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../store/useTheme';
import { borderRadius, shadows } from '../constants/theme';

interface ProgramCardProps {
    item: any;
    onSelect: (item: any) => void;
    onDelete: (id: string) => void;
}

export function ProgramCard({ item, onSelect, onDelete }: ProgramCardProps) {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onSelect(item)}
            style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary, height: 160 }]}
        >
            {item.bundle?.image ? (
                <ImageBackground
                    source={{ uri: item.bundle.image }}
                    style={StyleSheet.absoluteFill}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFill}
                    />
                </ImageBackground>
            ) : (
                <LinearGradient
                    colors={item.bundle?.gradient || [colors.accent.primary, colors.accent.secondary]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            )}

            <View style={[styles.cardContent, { justifyContent: 'flex-end', height: '100%' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'auto' }}>
                    <View style={styles.officialBadge}>
                        <Ionicons name="albums" size={12} color="#fff" />
                        <Text style={styles.officialText}>PROGRAM</Text>
                    </View>

                    {/* Program Delete Button */}
                    <TouchableOpacity
                        style={[styles.programDeleteBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
                        onPress={() => onDelete(item.id)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.cardTitle, { color: '#fff', fontSize: 22 }]}>{item.name}</Text>
                <Text style={[styles.cardSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                    {item.routines.length} Workouts Inside
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ color: colors.accent.primary, fontWeight: '600', marginRight: 4 }}>View Workouts</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.accent.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.lg,
        marginBottom: 12,
        ...shadows.sm,
        overflow: 'hidden',
        borderWidth: 1,
    },
    cardContent: {
        padding: 16,
    },
    officialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    officialText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
        letterSpacing: 1,
    },
    programDeleteBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
    },
});
