import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MuscleData, MuscleGroup } from '@/store/useMuscleStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/useTheme';

interface MuscleVisualizerCardProps {
    muscleData: Map<MuscleGroup, MuscleData>;
    loading?: boolean;
    onPress?: () => void;
    todaysExercises?: { muscleGroup: MuscleGroup; exerciseName: string; volume: number }[];
}

export const MuscleVisualizerCard: React.FC<MuscleVisualizerCardProps> = ({
    muscleData,
    loading = false,
    onPress,
}) => {
    const { colors, colorScheme } = useTheme();
    const workedMuscles = Array.from(muscleData.entries())
        .filter(([_, data]) => data.volume > 0)
        .sort((a, b) => b[1].volume - a[1].volume)
        .slice(0, 2);

    const totalVolume = Array.from(muscleData.values()).reduce((sum, data) => sum + data.volume, 0);
    const muscleCount = Array.from(muscleData.values()).filter(d => d.volume > 0).length;

    if (loading) {
        return (
            <View style={[styles.miniCard, { backgroundColor: colors.background.card }]}>
                <ActivityIndicator size="small" color={colors.accent.primary} />
            </View>
        );
    }

    const isDark = colorScheme === 'dark';

    return (
        <Pressable onPress={onPress}>
            <LinearGradient
                colors={isDark ? ['#1e293b', '#0f172a'] : [colors.background.card, colors.background.elevated]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.miniCard, { borderColor: colors.border.secondary, borderWidth: isDark ? 0 : 1 }]}
            >
                <View style={styles.content}>
                    <View style={styles.leftCol}>
                        <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.background.elevated }]}>
                            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#f59e0b" />
                            <Text style={styles.badgeText}>Visual Analytics</Text>
                        </View>
                        <Text style={[styles.mainTitle, { color: colors.text.primary }]}>Daily Impact</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.compactStat}>
                                <Text style={[styles.compactVal, { color: colors.text.primary }]}>{totalVolume > 1000 ? (totalVolume/1000).toFixed(1) + 'k' : totalVolume.toFixed(0)}</Text>
                                <Text style={[styles.compactLabel, { color: colors.text.tertiary }]}>Volume</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: colors.border.secondary }]} />
                            <View style={styles.compactStat}>
                                <Text style={[styles.compactVal, { color: colors.text.primary }]}>{muscleCount}</Text>
                                <Text style={[styles.compactLabel, { color: colors.text.tertiary }]}>Groups</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.rightCol}>
                        {workedMuscles.length > 0 ? (
                            <View style={[styles.miniList, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background.elevated }]}>
                                {workedMuscles.map(([muscle, data]) => (
                                    <View key={muscle} style={styles.miniMuscleRow}>
                                        <View style={[styles.dot, { backgroundColor: data.color }]} />
                                        <Text style={[styles.miniMuscleName, { color: colors.text.secondary }]} numberOfLines={1}>{muscle}</Text>
                                    </View>
                                ))}
                                {muscleCount > 2 && (
                                    <Text style={[styles.moreText, { color: colors.text.tertiary }]}>+{muscleCount - 2} more</Text>
                                )}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="dumbbell" size={24} color={colors.text.disabled} />
                                <Text style={[styles.emptyText, { color: colors.text.disabled }]}>Tap to analyze</Text>
                            </View>
                        )}
                    </View>
                </View>
                
                <View style={[styles.footer, { borderTopColor: colors.border.secondary }]}>
                    <Text style={[styles.footerText, { color: colors.text.tertiary }]}>Explore detailed heatmaps & recovery</Text>
                    <MaterialCommunityIcons name="chevron-right" size={14} color={colors.text.tertiary} />
                </View>
            </LinearGradient>
        </Pressable>
    );
};

export const WeeklyMuscleHeatmap: React.FC<{ weeklyData: Map<MuscleGroup, number[]> }> = ({ weeklyData }) => {
    const { colors, colorScheme } = useTheme();
    const muscleGroups = Array.from(weeklyData.keys()).slice(0, 8);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const isDark = colorScheme === 'dark';

    const getIntensityColor = (volume: number, maxVolume: number): string => {
        const intensity = volume / (maxVolume || 100);
        if (intensity === 0) return isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9';
        if (intensity < 0.3) return '#34d399'; 
        if (intensity < 0.7) return '#3b82f6';
        return '#8b5cf6';
    };

    const maxVolume = Math.max(...Array.from(weeklyData.values()).flatMap(v => v), 1);

    return (
        <View style={[styles.analyticsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.background.card, borderColor: colors.border.secondary }]}>
            <View style={styles.analyticsHeader}>
                <MaterialCommunityIcons name="calendar-month" size={18} color={colors.accent.primary} />
                <Text style={[styles.analyticsTitle, { color: colors.text.primary }]}>Weekly Consistency</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    <View style={styles.heatmapHeader}>
                        <View style={{ width: 80 }} />
                        {days.map(day => (
                            <View key={day} style={styles.dayCell}><Text style={[styles.dayText, { color: colors.text.tertiary }]}>{day}</Text></View>
                        ))}
                    </View>
                    {muscleGroups.map((muscle) => (
                        <View key={muscle} style={styles.heatmapRow}>
                            <Text style={[styles.heatmapMuscleLabel, { color: colors.text.secondary }]}>{muscle}</Text>
                            {(weeklyData.get(muscle) || Array(7).fill(0)).map((vol, i) => (
                                <View key={i} style={[styles.heatmapCell, { backgroundColor: getIntensityColor(vol, maxVolume) }]} />
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export const MuscleProgressChart: React.FC<{ muscleData: Map<MuscleGroup, MuscleData> }> = ({ muscleData }) => {
    const { colors, colorScheme } = useTheme();
    const sorted = Array.from(muscleData.entries()).sort((a, b) => b[1].volume - a[1].volume).slice(0, 10);
    const max = Math.max(...sorted.map(([_, d]) => d.volume), 1);
    const isDark = colorScheme === 'dark';

    return (
        <View style={[styles.analyticsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.background.card, borderColor: colors.border.secondary }]}>
            <View style={styles.analyticsHeader}>
                <MaterialCommunityIcons name="chart-bar" size={18} color="#8b5cf6" />
                <Text style={[styles.analyticsTitle, { color: colors.text.primary }]}>Volume Distribution</Text>
            </View>
            {sorted.map(([muscle, data]) => (
                <View key={muscle} style={styles.progressRow}>
                    <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>{muscle}</Text>
                    <View style={[styles.progressBarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }]}>
                        <View style={[styles.progressBarFill, { width: `${(data.volume / max) * 100}%`, backgroundColor: data.color }]} />
                    </View>
                    <Text style={[styles.progressValue, { color: colors.text.primary }]}>{data.volume > 1000 ? (data.volume/1000).toFixed(1) + 'k' : data.volume.toFixed(0)}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    miniCard: {
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    analyticsCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    analyticsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    analyticsTitle: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftCol: {
        flex: 1,
    },
    rightCol: {
        flex: 1,
        alignItems: 'flex-end',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        marginBottom: 8,
    },
    badgeText: {
        color: '#f59e0b',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    compactStat: {
        alignItems: 'flex-start',
    },
    compactVal: {
        fontSize: 18,
        fontWeight: '800',
    },
    compactLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 24,
    },
    miniList: {
        padding: 10,
        borderRadius: 16,
        width: '100%',
        gap: 6,
    },
    miniMuscleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    miniMuscleName: {
        fontSize: 12,
        fontWeight: '600',
    },
    moreText: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    emptyText: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    footerText: {
        fontSize: 11,
        fontWeight: '500',
    },
    heatmapHeader: { flexDirection: 'row', marginBottom: 12 },
    dayCell: { width: 34, height: 20, justifyContent: 'center', alignItems: 'center' },
    dayText: { fontSize: 10, fontWeight: '700' },
    heatmapRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    heatmapMuscleLabel: { width: 80, fontSize: 10, fontWeight: '700' },
    heatmapCell: { width: 30, height: 30, borderRadius: 8, margin: 2 },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
    progressLabel: { width: 75, fontSize: 11, fontWeight: '700' },
    progressBarContainer: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    progressValue: { width: 45, fontSize: 11, fontWeight: '800', textAlign: 'right' },
});

export default MuscleVisualizerCard;
