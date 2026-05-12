import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MuscleGroup } from '@/store/useMuscleStore';
import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type RecoveryStatus = 'FRESH' | 'FATIGUED' | 'SORE' | 'RECOVERING';

export interface RecoveryData {
    [muscleGroup: string]: {
        soreness: number;
        recoveryStatus: RecoveryStatus;
    };
}

interface MuscleRecoveryProps {
    onSave?: (data: RecoveryData) => void;
    initialData?: RecoveryData;
    muscleData?: Map<MuscleGroup, any>;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
    'Core', 'Abs', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves'
];

const createEmptyRecoveryData = (): RecoveryData =>
    MUSCLE_GROUPS.reduce<RecoveryData>((acc, muscle) => {
        acc[muscle] = { soreness: 0, recoveryStatus: 'FRESH' };
        return acc;
    }, {});

export const MuscleRecoveryTracker: React.FC<MuscleRecoveryProps> = ({ onSave, initialData }) => {
    const [recoveryData, setRecoveryData] = useState<RecoveryData>({
        ...createEmptyRecoveryData(),
        ...initialData,
    });
    const [savingMuscle, setSavingMuscle] = useState<string | null>(null);

    React.useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            setRecoveryData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleSorenessChange = (muscle: MuscleGroup, value: number) => {
        const soreness = Math.round(value);
        setRecoveryData(prev => ({
            ...prev,
            [muscle]: { ...prev[muscle], soreness, recoveryStatus: getStatusFromSoreness(soreness) }
        }));
    };

    const handleStatusSelect = (muscle: MuscleGroup, status: RecoveryStatus) => {
        setRecoveryData(prev => ({
            ...prev,
            [muscle]: { ...prev[muscle], recoveryStatus: status }
        }));
    };

    const handleSingleSave = async (muscle: MuscleGroup) => {
        setSavingMuscle(muscle);
        const singleMuscleData = { [muscle]: recoveryData[muscle] };
        await onSave?.(singleMuscleData as any);
        setTimeout(() => setSavingMuscle(null), 800);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={['rgba(59, 130, 246, 0.15)', 'rgba(30, 41, 59, 0.5)']}
                style={styles.explanationCard}
            >
                <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="information" size={18} color="#60a5fa" />
                    <Text style={styles.explanationTitle}>Recovery Insights</Text>
                </View>
                <Text style={styles.explanationText}>
                    Track muscle fatigue and soreness to optimize your training split. Tap the checkmark to log status.
                </Text>
            </LinearGradient>

            <View style={styles.muscleList}>
                {MUSCLE_GROUPS.map((muscle) => {
                    const data = recoveryData[muscle] ?? { soreness: 0, recoveryStatus: 'FRESH' };
                    const color = getStatusColor(data.recoveryStatus);
                    const isSaving = savingMuscle === muscle;

                    return (
                        <View key={muscle} style={styles.muscleCardContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                                style={styles.muscleCard}
                            >
                                <View style={[styles.colorIndicator, { backgroundColor: color }]} />
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.muscleTitle}>{muscle}</Text>
                                        <View style={styles.statusPill}>
                                            <Text style={[styles.statusText, { color }]}>{data.recoveryStatus}</Text>
                                        </View>
                                    </View>
                                    
                                    <Pressable 
                                        style={[styles.miniSaveBtn, isSaving && styles.miniSaveBtnActive]} 
                                        onPress={() => handleSingleSave(muscle)}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <MaterialCommunityIcons name="check" size={18} color="white" />
                                        )}
                                    </Pressable>
                                </View>

                                <View style={styles.statusRow}>
                                    {(['FRESH', 'RECOVERING', 'FATIGUED', 'SORE'] as const).map((s) => (
                                        <Pressable
                                            key={s}
                                            onPress={() => handleStatusSelect(muscle, s)}
                                            style={[
                                                styles.chip,
                                                data.recoveryStatus === s && { backgroundColor: getStatusColor(s) + '30', borderColor: getStatusColor(s) }
                                            ]}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                data.recoveryStatus === s && { color: getStatusColor(s) }
                                            ]}>{s.charAt(0)}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </LinearGradient>
                        </View>
                    );
                })}
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const getStatusColor = (status: RecoveryStatus): string => {
    switch (status) {
        case 'FRESH': return '#10b981';
        case 'RECOVERING': return '#3b82f6';
        case 'FATIGUED': return '#f59e0b';
        case 'SORE': return '#ef4444';
        default: return '#64748b';
    }
};

const getStatusFromSoreness = (soreness: number): RecoveryStatus => {
    if (soreness === 0) return 'FRESH';
    if (soreness <= 3) return 'RECOVERING';
    if (soreness <= 7) return 'FATIGUED';
    return 'SORE';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    explanationCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    explanationTitle: {
        color: '#60a5fa',
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    explanationText: {
        color: '#94a3b8',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
    },
    muscleList: {
        gap: 12,
    },
    muscleCardContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    muscleCard: {
        padding: 16,
        paddingLeft: 20,
    },
    colorIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    muscleTitle: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '800',
    },
    statusPill: {
        marginTop: 2,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    miniSaveBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    miniSaveBtnActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#60a5fa',
    },
    statusRow: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    chipText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '800',
    },
});
