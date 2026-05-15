import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';
import { spacing, shadows } from '../../constants/theme';
import { UserProfile } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import BadgesModal from './BadgesModal';
import { BADGES } from '../../constants/badges';

interface GamificationWidgetProps {
    user: UserProfile | null;
}

export function GamificationWidget({ user }: GamificationWidgetProps) {
    const { colors, mode } = useTheme();
    const [showBadges, setShowBadges] = useState(false);

    if (!user) return null;

    const level = user.level || 1;
    const xp = user.xp || 0;
    const xpForNextLevel = level * 100;
    const progress = Math.min(xp / xpForNextLevel, 1);

    return (
        <View style={[styles.container, { backgroundColor: colors.background.card }]}>
            <View style={styles.header}>
                <View style={styles.levelBadge}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.levelText}>Level {level}</Text>
                </View>
                <Text style={[styles.xpText, { color: colors.text.tertiary }]}>
                    {xp} / {xpForNextLevel} XP
                </Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressTrack, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <LinearGradient
                        colors={['#F59E0B', '#EF4444']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${progress * 100}%` }]}
                    />
                </View>
            </View>

            <View style={styles.badgesHeaderRow}>
                <Text style={[styles.badgesTitle, { color: colors.text.tertiary }]}>RECENT BADGES</Text>
                <TouchableOpacity onPress={() => setShowBadges(true)}>
                    <Text style={styles.viewAllBtn}>View All ({user.badges?.length || 0})</Text>
                </TouchableOpacity>
            </View>

            {user.badges && user.badges.length > 0 ? (
                <View style={styles.badgesContainer}>
                    {user.badges.slice(-3).map((badgeId, idx) => {
                        const bInfo = BADGES.find(b => b.id === badgeId);
                        return (
                            <View key={idx} style={[styles.badgeItem, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                                <Ionicons name={bInfo?.icon as any || 'medal'} size={16} color={bInfo?.color || '#3B82F6'} />
                                <Text style={[styles.badgeText, { color: colors.text.secondary }]} numberOfLines={1}>
                                    {bInfo?.name || badgeId}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            ) : (
                <Text style={[styles.noBadgesText, { color: colors.text.tertiary }]}>Complete workouts to earn badges!</Text>
            )}

            <BadgesModal 
                visible={showBadges} 
                onClose={() => setShowBadges(false)} 
                unlockedBadgeIds={user.badges || []} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        borderRadius: 24,
        marginBottom: spacing.xl,
        ...shadows.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    levelText: {
        color: '#F59E0B',
        fontSize: 14,
        fontWeight: 'bold',
    },
    xpText: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    badgesHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    badgesTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    viewAllBtn: {
        fontSize: 10,
        fontWeight: '700',
        color: '#22C55E',
    },
    noBadgesText: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    badgesContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    badgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        flex: 1,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
});
