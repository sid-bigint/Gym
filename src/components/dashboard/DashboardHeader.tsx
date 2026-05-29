import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../store/useTheme';
import { spacing } from '../../constants/theme';
import { UserProfile, WorkoutStreak } from '../../types';
import LevelInfoModal from './LevelInfoModal';

interface DashboardHeaderProps {
    user: UserProfile | null;
    streak: WorkoutStreak;
    greeting: string;
}

export function DashboardHeader({ user, streak, greeting }: DashboardHeaderProps) {
    const { colors, mode } = useTheme();
    const [showLevelInfo, setShowLevelInfo] = React.useState(false);

    return (
        <View style={styles.headerWrapper}>
            <LinearGradient
                colors={[colors.accent.primary, mode === 'dark' ? '#4C1D95' : colors.accent.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greetingText}>{greeting},</Text>
                        <Text style={styles.usernameText}>{user?.name?.split(' ')[0] || 'Athlete'}</Text>
                        {user?.level && (
                            <TouchableOpacity 
                                style={[styles.levelBadge, { alignSelf: 'flex-start' }]}
                                onPress={() => setShowLevelInfo(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="star" size={10} color="#FDE68A" />
                                <Text style={styles.levelText}>Level {user.level}</Text>
                            </TouchableOpacity>
                        )}
                        
                        <LevelInfoModal 
                            visible={showLevelInfo} 
                            onClose={() => setShowLevelInfo(false)} 
                            user={user} 
                        />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <TouchableOpacity
                            style={styles.headerActionBtn}
                            onPress={() => router.push('/(tabs)/routines' as any)}
                        >
                            <Ionicons name="add" size={24} color="white" />
                            <Text style={styles.headerActionText}>Start</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.profileBtn}
                            onPress={() => router.push('/(tabs)/settings' as any)}
                        >
                            <View style={styles.avatarContainer}>
                                {user?.picture ? (
                                    <Image source={{ uri: user.picture }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                ) : (
                                    <Image
                                        key={user?.gender}
                                        source={{
                                            uri: (user?.gender?.toLowerCase() === 'female')
                                                ? 'https://cdn-icons-png.flaticon.com/512/6997/6997662.png'
                                                : 'https://cdn-icons-png.flaticon.com/512/236/236831.png'
                                        }}
                                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd' }}
                                        resizeMode="cover"
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255,255,255,0.14)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.18)'
                    }}>
                        <Ionicons name="flame" size={18} color="#FDE68A" />
                        <Text style={{ color: 'white', fontSize: 13, fontWeight: '800' }}>
                            {streak.current} day streak
                        </Text>
                    </View>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)' }} />
                    <Text style={{ color: 'rgba(255,255,255,0.74)', fontSize: 12, fontWeight: '600' }}>
                        Best {streak.longest}
                    </Text>
                    
                    {/* Gamification Streak Shields Badge */}
                    {user?.streakShields ? (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            marginLeft: 'auto',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue tint for shields
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(59, 130, 246, 0.4)'
                        }}>
                            <Ionicons name="shield" size={14} color="#60A5FA" />
                            <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: 'bold' }}>
                                x{user.streakShields}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </LinearGradient>
        </View>
    );
}

import { StatusBar } from 'react-native';

const styles = StyleSheet.create({
    headerWrapper: {
        zIndex: 10,
    },
    headerGradient: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 48,
        paddingHorizontal: spacing.xl,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    greetingText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    usernameText: {
        color: 'white',
        fontSize: 28,
        fontWeight: '800',
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 2,
    },
    avatarContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerActionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginTop: 4,
    },
    levelText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '800',
    },
});
