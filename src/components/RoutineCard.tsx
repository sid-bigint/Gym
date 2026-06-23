import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../store/useTheme';
import { borderRadius, shadows } from '../constants/theme';

interface RoutineCardProps {
    item: any;
    analytics?: { lastPerformed: string; avgDuration: number };
    isSelectable?: boolean;
    isSelected?: boolean;
    isSelectionMode?: boolean;
    onToggleSelection?: (id: number) => void;
    onDelete?: (id: number) => void;
    onPin?: (id: number) => void;
    onStartWorkout?: (id: number) => void;
    styleOverride?: any;
}

export const RoutineCard = React.memo(function RoutineCard({
    item,
    analytics,
    isSelectable = false,
    isSelected = false,
    isSelectionMode = false,
    onToggleSelection,
    onDelete,
    onPin,
    onStartWorkout,
    styleOverride
}: RoutineCardProps) {
    const { colors } = useTheme();

    const renderAnalytics = () => {
        if (!analytics) return null;
        
        let lastPerformedStr = "Never";
        if (analytics.lastPerformed) {
            try {
                // Remove 'about' from 'about X days ago' for cleaner UI
                lastPerformedStr = formatDistanceToNow(new Date(analytics.lastPerformed), { addSuffix: true }).replace('about ', '');
            } catch (e) {
                lastPerformedStr = "Unknown";
            }
        }

        const avgMins = analytics.avgDuration ? Math.round(analytics.avgDuration / 60) : 0;

        return (
            <View style={styles.analyticsContainer}>
                <View style={styles.analyticBadge}>
                    <Ionicons name="calendar-outline" size={12} color={colors.text.tertiary} />
                    <Text style={[styles.analyticText, { color: colors.text.tertiary }]}>{lastPerformedStr}</Text>
                </View>
                {avgMins > 0 && (
                    <View style={styles.analyticBadge}>
                        <Ionicons name="stopwatch-outline" size={12} color={colors.text.tertiary} />
                        <Text style={[styles.analyticText, { color: colors.text.tertiary }]}>~{avgMins}m avg</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={() => {
                if (isSelectable && onToggleSelection) {
                    onToggleSelection(item.id);
                }
            }}
            onPress={() => {
                if (isSelectionMode && isSelectable && onToggleSelection) {
                    onToggleSelection(item.id);
                }
            }}
            style={[
                styles.card,
                {
                    backgroundColor: colors.background.card,
                    borderColor: isSelected ? colors.status.error : colors.border.primary,
                    borderWidth: isSelected ? 2 : 1
                },
                styleOverride
            ]}
        >
            <View style={[styles.cardContent, { opacity: (isSelectionMode && !isSelected) ? 0.6 : 1 }]}>
                <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>{item.name}</Text>
                            {item.isPinned && <Ionicons name="star" size={14} color={colors.accent.warning} style={{ marginLeft: 6 }} />}
                        </View>
                        <Text style={[styles.cardSubtitle, { color: colors.text.tertiary }]} numberOfLines={1}>
                            {item.exercises?.length > 0
                                ? item.exercises.map((e: any) => e.exercise?.name).join(', ')
                                : 'No exercises'}
                        </Text>
                    </View>
                    {isSelected && (
                        <View style={{ backgroundColor: colors.status.error + '20', borderRadius: 12, padding: 4 }}>
                            <Ionicons name="checkmark-circle" size={24} color={colors.status.error} />
                        </View>
                    )}
                </View>

                {renderAnalytics()}

                <View style={[styles.actionRow, { opacity: isSelectionMode ? 0.3 : 1 }]} pointerEvents={isSelectionMode ? "none" : "auto"}>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.background.elevated, marginRight: 8 }]}
                        onPress={() => router.push({ pathname: '/programs/create', params: { id: item.id } })}
                    >
                        <Ionicons name="pencil" size={18} color={colors.text.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: item.isPinned ? colors.accent.warning + '20' : colors.background.elevated, marginRight: 8 }]}
                        onPress={() => onPin && onPin(item.id)}
                    >
                        <Ionicons name={item.isPinned ? "star" : "star-outline"} size={18} color={item.isPinned ? colors.accent.warning : colors.text.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: 'rgba(255, 59, 48, 0.1)', marginRight: 'auto' }]}
                        onPress={() => onDelete && onDelete(item.id)}
                    >
                        <Ionicons name="trash" size={18} color={colors.status.error} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.startBtn, { backgroundColor: colors.accent.primary }]}
                        onPress={() => onStartWorkout && onStartWorkout(item.id)}
                    >
                        <Text style={[styles.startBtnText, { color: colors.text.inverse }]}>Start</Text>
                        <Ionicons name="play" size={16} color={colors.text.inverse} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.lg,
        marginBottom: 12,
        ...shadows.sm,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerInfo: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
    },
    analyticsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    analyticBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(150,150,150,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    analyticText: {
        fontSize: 12,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(150,150,150,0.1)',
        paddingTop: 16,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    startBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
