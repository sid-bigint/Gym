import { MuscleData, MuscleGroup } from '@/store/useMuscleStore';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Body from 'react-native-body-highlighter';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/useTheme';
import { useUserStore } from '@/store/useUserStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MuscleVisualizerProps {
    muscleData: Map<MuscleGroup, MuscleData>;
    onMuscleSelect?: (muscle: MuscleGroup) => void;
}

const mapMuscleToSlug = (muscle: MuscleGroup): string[] => {
    switch (muscle) {
        case 'Chest': return ['chest'];
        case 'Back': return ['trapezius', 'upper-back', 'lower-back'];
        case 'Shoulders': return ['front-deltoids', 'back-deltoids'];
        case 'Biceps': return ['biceps'];
        case 'Triceps': return ['triceps'];
        case 'Forearms': return ['forearm'];
        case 'Core': return ['obliques'];
        case 'Abs': return ['abs'];
        case 'Quadriceps': return ['quadriceps'];
        case 'Hamstrings': return ['hamstring'];
        case 'Glutes': return ['gluteal'];
        case 'Calves': return ['calves'];
        default: return [];
    }
};

const mapSlugToMuscle = (slug: string): MuscleGroup | null => {
    const map: Record<string, MuscleGroup> = {
        'chest': 'Chest',
        'trapezius': 'Back', 'upper-back': 'Back', 'lower-back': 'Back',
        'front-deltoids': 'Shoulders', 'back-deltoids': 'Shoulders',
        'biceps': 'Biceps', 'triceps': 'Triceps', 'forearm': 'Forearms',
        'obliques': 'Core', 'abs': 'Abs',
        'quadriceps': 'Quadriceps', 'hamstring': 'Hamstrings',
        'gluteal': 'Glutes', 'calves': 'Calves',
    };
    return map[slug] || null;
};

export const MuscleVisualizer: React.FC<MuscleVisualizerProps> = ({ muscleData, onMuscleSelect }) => {
    const { colors, colorScheme } = useTheme();
    const { user } = useUserStore();
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
    const isDark = colorScheme === 'dark';

    const gender = user?.gender === 'female' ? 'female' : 'male';

    const bodyData = useMemo(() => {
        const dataArray: Array<{ slug: any; intensity?: number; color?: string; styles?: any }> = [];

        // Apply a premium, high-tech styled hair look!
        dataArray.push({
            slug: 'hair',
            styles: {
                fill: isDark ? '#1e293b' : '#334155', // Sleek obsidian/dark slate hair
                stroke: colors.accent.primary,        // Glowing neon theme-accent hair outline!
                strokeWidth: 1.5
            }
        });

        muscleData.forEach((data, muscleGroup) => {
            if (data.intensity > 0 || data.soreness > 0) {
                mapMuscleToSlug(muscleGroup).forEach(slug => {
                    dataArray.push({
                        slug,
                        intensity: Math.max(1, Math.ceil((data.intensity / 10) * 4)),
                        color: data.color,
                    });
                });
            }
        });

        if (selectedMuscle) {
            mapMuscleToSlug(selectedMuscle).forEach(slug => {
                const idx = dataArray.findIndex(d => d.slug === slug);
                if (idx >= 0) dataArray.splice(idx, 1);
                dataArray.push({ slug, intensity: 4, color: colors.accent.primary });
            });
        }

        return dataArray;
    }, [muscleData, selectedMuscle, colors.accent.primary, isDark]);

    const handleMusclePress = useCallback(
        (slugInfo: any) => {
            const slug = typeof slugInfo === 'string' ? slugInfo : slugInfo?.slug;
            const muscle = mapSlugToMuscle(slug);
            if (muscle) {
                setSelectedMuscle(prev => (prev === muscle ? null : muscle));
                onMuscleSelect?.(muscle);
            }
        },
        [onMuscleSelect]
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDark ? [colors.background.elevated, colors.background.card] : ['#fff', '#f8fafc']}
                style={[styles.card, { borderColor: colors.border.secondary, borderWidth: 1 }]}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text.primary }]}>360° Anatomy Analysis</Text>
                    <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>Dynamic muscle activity & heatmaps</Text>
                </View>

                <View style={styles.visualizerRow}>
                    <View style={styles.bodyWrapper}>
                        <View style={[styles.labelContainer, { backgroundColor: colors.background.elevated }]}>
                            <Text style={[styles.label, { color: colors.text.tertiary }]}>ANTERIOR</Text>
                        </View>
                        <View style={styles.bodyTransform}>
                            <Body
                                data={bodyData}
                                gender={gender}
                                side="front"
                                scale={0.85}
                                onBodyPartPress={handleMusclePress}
                                colors={isDark ? ['#334155', '#34d399', '#3b82f6', '#8b5cf6', '#ef4444', '#7f1d1d'] : ['#e2e8f0', '#34d399', '#3b82f6', '#8b5cf6', '#ef4444', '#7f1d1d']}
                                defaultFill={isDark ? '#1e293b' : '#f8fafc'}
                                defaultStroke={isDark ? '#334155' : '#cbd5e1'}
                                defaultStrokeWidth={0.5}
                                border={isDark ? '#334155' : '#cbd5e1'}
                            />
                        </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border.secondary }]} />
                    <View style={styles.bodyWrapper}>
                        <View style={[styles.labelContainer, { backgroundColor: colors.background.elevated }]}>
                            <Text style={[styles.label, { color: colors.text.tertiary }]}>POSTERIOR</Text>
                        </View>
                        <View style={styles.bodyTransform}>
                            <Body
                                data={bodyData}
                                gender={gender}
                                side="back"
                                scale={0.85}
                                onBodyPartPress={handleMusclePress}
                                colors={isDark ? ['#334155', '#34d399', '#3b82f6', '#8b5cf6', '#ef4444', '#7f1d1d'] : ['#e2e8f0', '#34d399', '#3b82f6', '#8b5cf6', '#ef4444', '#7f1d1d']}
                                defaultFill={isDark ? '#1e293b' : '#f8fafc'}
                                defaultStroke={isDark ? '#334155' : '#cbd5e1'}
                                defaultStrokeWidth={0.5}
                                border={isDark ? '#334155' : '#cbd5e1'}
                            />
                        </View>
                    </View>
                </View>

                {selectedMuscle && (
                    <View style={[styles.selectedIndicator, { backgroundColor: colors.accent.primary + '15' }]}>
                        <View style={[styles.indicatorPulse, { backgroundColor: colors.accent.primary }]} />
                        <Text style={[styles.selectedText, { color: colors.accent.primary }]}>Focus: {selectedMuscle}</Text>
                    </View>
                )}
            </LinearGradient>
            
            <View style={styles.legend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#34d399' }]} /><Text style={[styles.legendText, { color: colors.text.tertiary }]}>Low</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} /><Text style={[styles.legendText, { color: colors.text.tertiary }]}>Med</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} /><Text style={[styles.legendText, { color: colors.text.tertiary }]}>High</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={[styles.legendText, { color: colors.text.tertiary }]}>Max</Text></View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        paddingTop: 28,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        overflow: 'hidden',
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
        zIndex: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    visualizerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 320, // Reduced height to match smaller scale
    },
    bodyWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyTransform: {
        marginTop: 0,
    },
    divider: {
        width: 1,
        height: '30%',
        marginHorizontal: 10, // Increased spacing to separate hands
    },
    labelContainer: {
        position: 'absolute',
        top: -15,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        zIndex: 20,
    },
    label: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 2,
    },
    selectedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 12,
        marginTop: 24,
        gap: 8,
    },
    indicatorPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    selectedText: {
        fontSize: 12,
        fontWeight: '700',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '600',
    },
});
