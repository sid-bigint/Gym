import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useTheme';
import { spacing, shadows } from '../../constants/theme';
import { InsightEngine, Insight } from '../../services/InsightEngine';
import { LinearGradient } from 'expo-linear-gradient';

export function AIInsightsWidget() {
    const { colors, mode } = useTheme();
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let isMounted = true;
        
        async function fetchInsights() {
            setLoading(true);
            try {
                const generated = await InsightEngine.generateWeeklyInsights();
                if (isMounted) {
                    setInsights(generated);
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true
                    }).start();
                }
            } catch (e) {
                console.warn('Failed to load insights', e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchInsights();

        return () => { isMounted = false; };
    }, []);

    if (loading || insights.length === 0) return null;

    const getIconForType = (type: Insight['type']) => {
        switch(type) {
            case 'performance': return 'trending-up';
            case 'habit': return 'calendar';
            case 'nutrition': return 'restaurant';
            case 'celebration': return 'star';
            default: return 'bulb';
        }
    };

    const getColorForType = (type: Insight['type']) => {
        switch(type) {
            case 'performance': return '#3B82F6';
            case 'habit': return '#F59E0B';
            case 'nutrition': return '#10B981';
            case 'celebration': return '#8B5CF6';
            default: return '#22C55E';
        }
    };

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <View style={[styles.container, { backgroundColor: colors.background.card }]}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                        <Text style={[styles.headerTitle, { color: colors.text.secondary }]}>AI INSIGHTS</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>Updated Today</Text>
                </View>

                <View style={styles.insightList}>
                    {insights.map((insight, idx) => (
                        <View key={insight.id} style={[
                            styles.insightCard, 
                            { 
                                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                borderTopWidth: idx > 0 ? 1 : 0,
                                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                            }
                        ]}>
                            <View style={styles.iconCol}>
                                <View style={[styles.iconBox, { backgroundColor: getColorForType(insight.type) + '20' }]}>
                                    <Ionicons name={getIconForType(insight.type)} size={20} color={getColorForType(insight.type)} />
                                </View>
                            </View>
                            <View style={styles.contentCol}>
                                <Text style={[styles.insightTitle, { color: colors.text.primary }]}>
                                    {insight.title}
                                </Text>
                                <Text style={[styles.insightMessage, { color: colors.text.secondary }]}>
                                    {insight.message}
                                </Text>
                                {insight.actionable_advice && (
                                    <View style={styles.adviceBox}>
                                        <Text style={[styles.adviceText, { color: getColorForType(insight.type) }]}>
                                            <Text style={{fontWeight: '800'}}>Tip:</Text> {insight.actionable_advice}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </Animated.View>
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
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    headerSubtitle: {
        fontSize: 10,
        color: 'rgba(139,92,246,0.8)',
        fontWeight: '600',
    },
    insightList: {
        flexDirection: 'column',
    },
    insightCard: {
        flexDirection: 'row',
        paddingVertical: 12,
        gap: 12,
    },
    iconCol: {
        paddingTop: 2,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentCol: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    insightMessage: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    adviceBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 10,
        borderRadius: 8,
    },
    adviceText: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
    }
});
