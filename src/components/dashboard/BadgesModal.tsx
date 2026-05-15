import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BADGES } from '../../constants/badges';

interface BadgesModalProps {
    visible: boolean;
    onClose: () => void;
    unlockedBadgeIds: string[];
}

const { height } = Dimensions.get('window');

const GREEN = '#22C55E';
const BG_DARK = '#080A0C';
const SURFACE = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.08)';

export default function BadgesModal({ visible, onClose, unlockedBadgeIds }: BadgesModalProps) {
    const unlockedCount = unlockedBadgeIds.length;
    const totalCount = BADGES.length;

    // Group badges by category
    const categories = ['workout', 'streak', 'nutrition', 'milestone'] as const;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
            <View style={s.modalContainer}>
                <View style={s.content}>
                    {/* Header */}
                    <View style={s.header}>
                        <View>
                            <Text style={s.title}>Achievements</Text>
                            <Text style={s.subtitle}>
                                Unlocked {unlockedCount} of {totalCount} badges
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Progress Bar */}
                    <View style={s.progressContainer}>
                        <View style={s.progressBar}>
                            <View style={[s.progressFill, { width: `${(unlockedCount / totalCount) * 100}%` }]} />
                        </View>
                    </View>

                    {/* Badge List */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
                        {categories.map(category => {
                            const categoryBadges = BADGES.filter(b => b.category === category);
                            if (categoryBadges.length === 0) return null;

                            return (
                                <View key={category} style={s.categorySection}>
                                    <Text style={s.categoryTitle}>{category.toUpperCase()}</Text>
                                    <View style={s.badgeGrid}>
                                        {categoryBadges.map(badge => {
                                            const isUnlocked = unlockedBadgeIds.includes(badge.id);
                                            return (
                                                <View key={badge.id} style={[s.badgeCard, !isUnlocked && s.badgeCardLocked]}>
                                                    <View style={[
                                                        s.iconContainer, 
                                                        isUnlocked ? { backgroundColor: badge.color + '20' } : s.iconContainerLocked
                                                    ]}>
                                                        <Ionicons 
                                                            name={badge.icon as any} 
                                                            size={28} 
                                                            color={isUnlocked ? badge.color : 'rgba(255,255,255,0.1)'} 
                                                        />
                                                    </View>
                                                    <Text style={[s.badgeName, !isUnlocked && s.textLocked]} numberOfLines={1}>
                                                        {badge.name}
                                                    </Text>
                                                    <Text style={s.badgeDesc} numberOfLines={3}>
                                                        {isUnlocked ? badge.description : 'Locked'}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: BG_DARK,
        height: height * 0.85,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderTopWidth: 1,
        borderColor: BORDER,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: GREEN,
        fontWeight: '700',
        marginTop: 4,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: SURFACE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressBar: {
        height: 8,
        backgroundColor: SURFACE,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: GREEN,
        borderRadius: 4,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 2,
        marginBottom: 16,
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    badgeCard: {
        width: '48%',
        backgroundColor: SURFACE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
    },
    badgeCardLocked: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.03)',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    iconContainerLocked: {
        backgroundColor: SURFACE,
    },
    badgeName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    textLocked: {
        color: 'rgba(255,255,255,0.2)',
    },
    badgeDesc: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        lineHeight: 16,
    },
});
