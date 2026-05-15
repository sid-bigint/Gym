import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';
import { spacing } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface LevelInfoModalProps {
    visible: boolean;
    onClose: () => void;
    user: any;
}

const { width } = Dimensions.get('window');

export default function LevelInfoModal({ visible, onClose, user }: LevelInfoModalProps) {
    const { colors, mode } = useTheme();
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    const xpForNextLevel = level * 100;
    const progress = Math.min(xp / xpForNextLevel, 1);

    const xpRules = [
        { icon: 'restaurant', label: 'Log a Meal', xp: '+10 XP', color: '#EC4899' },
        { icon: 'fitness', label: 'Complete Workout', xp: '+25 XP', color: '#3B82F6' },
        { icon: 'star', label: 'Perfect Day', xp: '+50 XP', color: '#F59E0B' },
        { icon: 'trophy', label: 'Challenges', xp: '+50 XP', color: '#8B5CF6' },
    ];

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[styles.content, { backgroundColor: colors.background.card }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text.primary }]}>Level Journey</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.progressSection}>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelNumber}>{level}</Text>
                            <Text style={styles.levelLabel}>LEVEL</Text>
                        </View>
                        
                        <View style={styles.xpInfo}>
                            <View style={styles.xpRow}>
                                <Text style={[styles.xpText, { color: colors.text.secondary }]}>Current Progress</Text>
                                <Text style={[styles.xpValue, { color: colors.accent.primary }]}>{xp} / {xpForNextLevel} XP</Text>
                            </View>
                            <View style={[styles.progressBar, { backgroundColor: colors.border.secondary }]}>
                                <LinearGradient
                                    colors={['#F59E0B', '#EF4444']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressFill, { width: `${progress * 100}%` }]}
                                />
                            </View>
                            <Text style={[styles.xpNext, { color: colors.text.tertiary }]}>
                                {xpForNextLevel - xp} XP needed for Level {level + 1}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>HOW TO EARN XP</Text>
                    
                    <View style={styles.rulesGrid}>
                        {xpRules.map((rule, idx) => (
                            <View key={idx} style={[styles.ruleItem, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                                <View style={[styles.ruleIcon, { backgroundColor: rule.color + '20' }]}>
                                    <Ionicons name={rule.icon as any} size={20} color={rule.color} />
                                </View>
                                <View>
                                    <Text style={[styles.ruleLabel, { color: colors.text.primary }]}>{rule.label}</Text>
                                    <Text style={[styles.ruleXp, { color: rule.color }]}>{rule.xp}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: colors.accent.primary }]}
                        onPress={onClose}
                    >
                        <Text style={styles.actionBtnText}>Keep Pushing</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        padding: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 32,
        padding: 16,
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.1)',
    },
    levelBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    levelNumber: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
    },
    levelLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '800',
        marginTop: -2,
    },
    xpInfo: {
        flex: 1,
    },
    xpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    xpText: {
        fontSize: 12,
        fontWeight: '600',
    },
    xpValue: {
        fontSize: 12,
        fontWeight: '800',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    xpNext: {
        fontSize: 10,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    rulesGrid: {
        gap: 12,
        marginBottom: 32,
    },
    ruleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        gap: 12,
    },
    ruleIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ruleLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    ruleXp: {
        fontSize: 12,
        fontWeight: '800',
        marginTop: 2,
    },
    actionBtn: {
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    actionBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
});
