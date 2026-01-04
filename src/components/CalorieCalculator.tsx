import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/theme';

interface CalorieCalculatorProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (results: CalculatorResults) => void;
    initialValues?: {
        weight?: number;
        height?: number;
        age?: number;
        gender?: 'male' | 'female';
        activityLevel?: string;
        goal?: 'cut' | 'bulk' | 'maintain';
    };
}

interface CalculatorResults {
    bmr: number;
    tdee: number;
    goal: 'cut' | 'bulk' | 'maintain';
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female';
    activityLevel: string;
}

export function CalorieCalculator({ visible, onClose, onSave, initialValues }: CalorieCalculatorProps) {
    const { colors } = useTheme();
    const scrollRef = React.useRef<ScrollView>(null);

    // Unit selection
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg'); // Default to KG since DB uses KG
    const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>('cm');

    // Stats State
    const [age, setAge] = useState('25');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [heightFt, setHeightFt] = useState('5');
    const [heightIn, setHeightIn] = useState('10');
    const [heightCm, setHeightCm] = useState('178');
    const [weightLbs, setWeightLbs] = useState('165');
    const [weightKg, setWeightKg] = useState('75');
    const [activityLevel, setActivityLevel] = useState('moderate');
    const [goal, setGoal] = useState<'cut' | 'bulk' | 'maintain'>('maintain');

    useEffect(() => {
        if (visible && initialValues) {
            if (initialValues.age) setAge(initialValues.age.toString());
            if (initialValues.gender) setGender(initialValues.gender);

            if (initialValues.height) {
                setHeightCm(initialValues.height.toString());
                // Approx conversion for display if user switches
                const totalInches = initialValues.height / 2.54;
                setHeightFt(Math.floor(totalInches / 12).toString());
                setHeightIn(Math.round(totalInches % 12).toString());
            }

            if (initialValues.weight) {
                setWeightKg(initialValues.weight.toString());
                setWeightLbs(Math.round(initialValues.weight * 2.20462).toString());
            }

            if (initialValues.activityLevel) setActivityLevel(initialValues.activityLevel);
            if (initialValues.goal) setGoal(initialValues.goal);
        }
    }, [visible]);

    // Results
    const [bmr, setBmr] = useState(0);
    const [tdee, setTdee] = useState(0);
    const [calorieGoal, setCalorieGoal] = useState(0);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (showResults) {
            // Wait for next frame so the ScrollView has laid out the new content
            requestAnimationFrame(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            });
        }
    }, [showResults]);

    const activityLevels = [
        { id: 'sedentary', label: 'Sedentary: little or no exercise', multiplier: 1.2 },
        { id: 'light', label: 'Lightly Active: exercise 1-3 times/week', multiplier: 1.375 },
        { id: 'moderate', label: 'Moderately Active: exercise 4-5 times/week', multiplier: 1.55 },
        { id: 'active', label: 'Extremely Active: daily exercise or intense exercise 3-4 times/week', multiplier: 1.725 },
        { id: 'very_active', label: 'Pro Athlete: intense exercise 6-7 times/week', multiplier: 1.9 },
    ];

    const calculateBMR = () => {
        const ageNum = Number(age) || 25;
        const weightInKg = weightUnit === 'lbs' ? (Number(weightLbs) || 165) * 0.453592 : (Number(weightKg) || 75);
        const heightInCm = heightUnit === 'ft'
            ? ((Number(heightFt) || 5) * 12 + (Number(heightIn) || 10)) * 2.54
            : (Number(heightCm) || 178);

        let bmrValue = (10 * weightInKg) + (6.25 * heightInCm) - (5 * ageNum);
        bmrValue = gender === 'male' ? bmrValue + 5 : bmrValue - 161;

        return Math.round(bmrValue);
    };

    const calculateTDEE = (bmrValue: number) => {
        const activity = activityLevels.find(a => a.id === activityLevel);
        return Math.round(bmrValue * (activity?.multiplier || 1.55));
    };

    const calculateCalorieGoal = (tdeeValue: number) => {
        if (goal === 'cut') return Math.round(tdeeValue * 0.85); // 15% deficit
        if (goal === 'bulk') return Math.round(tdeeValue * 1.10); // 10% surplus
        return tdeeValue;
    };

    const calculateMacros = (calories: number) => {
        const weightInLbs = weightUnit === 'lbs' ? Number(weightLbs) : Number(weightKg) * 2.20462;

        // Protein: 0.9g per lb of body weight (Perfect balance for most)
        let proteinGrams = Math.round(weightInLbs * 0.9);

        // Ensure protein doesn't exceed 40% of calories (safety cap for low calorie diets)
        const maxProteinGrams = Math.floor((calories * 0.4) / 4);
        proteinGrams = Math.min(proteinGrams, maxProteinGrams);
        proteinGrams = Math.max(proteinGrams, 50); // Floor of 50g

        // Fats: 25% of total calories
        let fatGrams = Math.round((calories * 0.25) / 9);
        fatGrams = Math.max(fatGrams, 30); // Floor of 30g

        // Carbs: remaining calories
        const proteinCals = proteinGrams * 4;
        const fatCals = fatGrams * 9;
        let carbGrams = Math.round((calories - proteinCals - fatCals) / 4);
        carbGrams = Math.max(carbGrams, 50); // Floor of 50g

        return { protein: proteinGrams, carbs: carbGrams, fats: fatGrams };
    };

    const handleCalculate = () => {
        const bmrValue = calculateBMR();
        const tdeeValue = calculateTDEE(bmrValue);
        const cals = calculateCalorieGoal(tdeeValue);

        setBmr(bmrValue);
        setTdee(tdeeValue);
        setCalorieGoal(cals);
        setShowResults(true);
    };

    const handleClear = () => {
        setAge('25');
        setGender('male');
        setHeightFt('5');
        setHeightIn('10');
        setHeightCm('178');
        setWeightLbs('165');
        setWeightKg('75');
        setActivityLevel('moderate');
        setGoal('maintain');
        setShowResults(false);
    };

    const handleSaveResults = () => {
        if (onSave && showResults) {
            const m = calculateMacros(calorieGoal);

            // Normalize values for save
            const weightInKg = weightUnit === 'lbs' ? (Number(weightLbs) || 0) * 0.453592 : (Number(weightKg) || 0);
            const heightInCm = heightUnit === 'ft'
                ? ((Number(heightFt) || 0) * 12 + (Number(heightIn) || 0)) * 2.54
                : (Number(heightCm) || 0);

            onSave({
                bmr,
                tdee,
                goal,
                calories: calorieGoal,
                protein: m.protein,
                carbs: m.carbs,
                fats: m.fats,
                weight: Math.round(weightInKg * 10) / 10,
                height: Math.round(heightInCm),
                age: Number(age) || 0,
                gender,
                activityLevel
            });
        }
        onClose();
    };

    const macros = showResults ? calculateMacros(calorieGoal) : null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
                        <Text style={[styles.title, { color: colors.text.primary }]}>Calorie Calculator</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView ref={scrollRef}>
                        {/* Input Section */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Stats</Text>

                            {/* Age */}
                            <Text style={[styles.label, { color: colors.text.secondary }]}>Age (15-80)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                placeholder="25"
                                placeholderTextColor={colors.text.disabled}
                                keyboardType="numeric"
                                value={age}
                                onChangeText={setAge}
                            />

                            {/* Gender */}
                            <Text style={[styles.label, { color: colors.text.secondary }]}>Gender</Text>
                            <View style={styles.genderRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                        gender === 'male' && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                                    ]}
                                    onPress={() => setGender('male')}
                                >
                                    <Ionicons name="male" size={20} color={gender === 'male' ? colors.text.inverse : colors.text.tertiary} />
                                    <Text style={[styles.genderText, { color: gender === 'male' ? colors.text.inverse : colors.text.tertiary }]}>Male</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                        gender === 'female' && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                                    ]}
                                    onPress={() => setGender('female')}
                                >
                                    <Ionicons name="female" size={20} color={gender === 'female' ? colors.text.inverse : colors.text.tertiary} />
                                    <Text style={[styles.genderText, { color: gender === 'female' ? colors.text.inverse : colors.text.tertiary }]}>Female</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Height */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md }}>
                                <Text style={[styles.label, { color: colors.text.secondary, marginTop: 0, marginBottom: 0 }]}>Height</Text>
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.unitToggle,
                                            { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                            heightUnit === 'ft' && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                                        ]}
                                        onPress={() => setHeightUnit('ft')}
                                    >
                                        <Text style={[styles.unitToggleText, { color: heightUnit === 'ft' ? colors.text.inverse : colors.text.tertiary }]}>
                                            ft/in
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.unitToggle,
                                            { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                            heightUnit === 'cm' && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                                        ]}
                                        onPress={() => setHeightUnit('cm')}
                                    >
                                        <Text style={[styles.unitToggleText, { color: heightUnit === 'cm' ? colors.text.inverse : colors.text.tertiary }]}>
                                            cm
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {heightUnit === 'ft' ? (
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                            placeholder="5"
                                            placeholderTextColor={colors.text.disabled}
                                            keyboardType="numeric"
                                            value={heightFt}
                                            onChangeText={setHeightFt}
                                        />
                                        <Text style={[styles.unitLabel, { color: colors.text.disabled }]}>feet</Text>
                                    </View>
                                    <View style={{ width: spacing.md }} />
                                    <View style={{ flex: 1 }}>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                            placeholder="10"
                                            placeholderTextColor={colors.text.disabled}
                                            keyboardType="numeric"
                                            value={heightIn}
                                            onChangeText={setHeightIn}
                                        />
                                        <Text style={[styles.unitLabel, { color: colors.text.disabled }]}>inches</Text>
                                    </View>
                                </View>
                            ) : (
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                    placeholder="178"
                                    placeholderTextColor={colors.text.disabled}
                                    keyboardType="numeric"
                                    value={heightCm}
                                    onChangeText={setHeightCm}
                                />
                            )}


                            {/* Weight */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md }}>
                                <Text style={[styles.label, { color: colors.text.secondary, marginTop: 0, marginBottom: 0 }]}>Weight</Text>
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.unitToggle,
                                            { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                            weightUnit === 'lbs' && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                                        ]}
                                        onPress={() => setWeightUnit('lbs')}
                                    >
                                        <Text style={[styles.unitToggleText, { color: weightUnit === 'lbs' ? colors.text.inverse : colors.text.tertiary }]}>
                                            lbs
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.unitToggle,
                                            { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                            weightUnit === 'kg' && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                                        ]}
                                        onPress={() => setWeightUnit('kg')}
                                    >
                                        <Text style={[styles.unitToggleText, { color: weightUnit === 'kg' ? colors.text.inverse : colors.text.tertiary }]}>
                                            kg
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {weightUnit === 'lbs' ? (
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                    placeholder="165"
                                    placeholderTextColor={colors.text.disabled}
                                    keyboardType="numeric"
                                    value={weightLbs}
                                    onChangeText={setWeightLbs}
                                />
                            ) : (
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                    placeholder="75"
                                    placeholderTextColor={colors.text.disabled}
                                    keyboardType="numeric"
                                    value={weightKg}
                                    onChangeText={setWeightKg}
                                />
                            )}

                            {/* Activity Level */}
                            <Text style={[styles.label, { color: colors.text.secondary }]}>Activity Level</Text>
                            <View style={styles.activityList}>
                                {activityLevels.map((activity) => (
                                    <TouchableOpacity
                                        key={activity.id}
                                        style={[
                                            styles.activityOption,
                                            { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                            activityLevel === activity.id && { backgroundColor: colors.accent.secondary, borderColor: colors.accent.primary }
                                        ]}
                                        onPress={() => setActivityLevel(activity.id)}
                                    >
                                        <Text style={[styles.activityText, { color: activityLevel === activity.id ? colors.text.inverse : colors.text.primary }]}>
                                            {activity.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Goal */}
                            <Text style={[styles.label, { color: colors.text.secondary }]}>Your Goal</Text>
                            <View style={styles.goalRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.goalButton,
                                        { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                        goal === 'cut' && { backgroundColor: colors.accent.warning, borderColor: colors.accent.warning }
                                    ]}
                                    onPress={() => setGoal('cut')}
                                >
                                    <Ionicons name="trending-down" size={20} color={goal === 'cut' ? colors.text.inverse : colors.text.tertiary} />
                                    <Text style={[styles.goalText, { color: goal === 'cut' ? colors.text.inverse : colors.text.tertiary }]}>Cut</Text>
                                    <Text style={[styles.goalSubtext, { color: goal === 'cut' ? colors.text.inverse : colors.text.disabled }]}>-15%</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.goalButton,
                                        { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                        goal === 'maintain' && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                                    ]}
                                    onPress={() => setGoal('maintain')}
                                >
                                    <Ionicons name="remove" size={20} color={goal === 'maintain' ? colors.text.inverse : colors.text.tertiary} />
                                    <Text style={[styles.goalText, { color: goal === 'maintain' ? colors.text.inverse : colors.text.tertiary }]}>Maintain</Text>
                                    <Text style={[styles.goalSubtext, { color: goal === 'maintain' ? colors.text.inverse : colors.text.disabled }]}>±0%</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.goalButton,
                                        { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                        goal === 'bulk' && { backgroundColor: colors.accent.success, borderColor: colors.accent.success }
                                    ]}
                                    onPress={() => setGoal('bulk')}
                                >
                                    <Ionicons name="trending-up" size={20} color={goal === 'bulk' ? colors.text.inverse : colors.text.tertiary} />
                                    <Text style={[styles.goalText, { color: goal === 'bulk' ? colors.text.inverse : colors.text.tertiary }]}>Bulk</Text>
                                    <Text style={[styles.goalSubtext, { color: goal === 'bulk' ? colors.text.inverse : colors.text.disabled }]}>+10%</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.clearButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                                onPress={handleClear}
                            >
                                <Text style={[styles.clearButtonText, { color: colors.text.secondary }]}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.calculateButton, { backgroundColor: colors.accent.success }]}
                                onPress={handleCalculate}
                            >
                                <Ionicons name="calculator" size={20} color={colors.text.inverse} />
                                <Text style={[styles.calculateButtonText, { color: colors.text.inverse }]}>Calculate</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Results Section */}
                        {showResults && (
                            <View style={[styles.resultsSection, { backgroundColor: colors.background.elevated, borderColor: colors.border.primary }]}>
                                <Text style={[styles.resultTitle, { color: colors.text.primary }]}>Your Results</Text>

                                <View style={styles.resultRow}>
                                    <View style={[styles.resultCard, { backgroundColor: colors.background.card }]}>
                                        <Text style={[styles.resultLabel, { color: colors.text.tertiary }]}>BMR</Text>
                                        <Text style={[styles.resultValue, { color: colors.accent.primary }]}>{bmr}</Text>
                                        <Text style={[styles.resultUnit, { color: colors.text.disabled }]}>calories/day</Text>
                                    </View>
                                    <View style={[styles.resultCard, { backgroundColor: colors.background.card }]}>
                                        <Text style={[styles.resultLabel, { color: colors.text.tertiary }]}>TDEE</Text>
                                        <Text style={[styles.resultValue, { color: colors.accent.secondary }]}>{tdee}</Text>
                                        <Text style={[styles.resultUnit, { color: colors.text.disabled }]}>calories/day</Text>
                                    </View>
                                </View>

                                <View style={[styles.targetCard, { backgroundColor: colors.accent.primary }]}>
                                    <Text style={[styles.targetLabel, { color: colors.text.inverse }]}>Target Calories ({goal})</Text>
                                    <Text style={[styles.targetValue, { color: colors.text.inverse }]}>{calorieGoal}</Text>
                                    <Text style={[styles.targetUnit, { color: colors.text.inverse }]}>calories per day</Text>
                                </View>

                                {macros && (
                                    <View style={styles.macrosSection}>
                                        <Text style={[styles.macrosTitle, { color: colors.text.primary }]}>Recommended Macros</Text>
                                        <View style={styles.macroRow}>
                                            <View style={[styles.macroCard, { backgroundColor: colors.nutrition.protein }]}>
                                                <Text style={[styles.macroValue, { color: colors.text.inverse }]}>{macros.protein}g</Text>
                                                <Text style={[styles.macroLabel, { color: colors.text.inverse }]}>Protein</Text>
                                            </View>
                                            <View style={[styles.macroCard, { backgroundColor: colors.nutrition.carbs }]}>
                                                <Text style={[styles.macroValue, { color: colors.text.inverse }]}>{macros.carbs}g</Text>
                                                <Text style={[styles.macroLabel, { color: colors.text.inverse }]}>Carbs</Text>
                                            </View>
                                            <View style={[styles.macroCard, { backgroundColor: colors.nutrition.fats }]}>
                                                <Text style={[styles.macroValue, { color: colors.text.inverse }]}>{macros.fats}g</Text>
                                                <Text style={[styles.macroLabel, { color: colors.text.inverse }]}>Fats</Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.saveButton, { backgroundColor: colors.accent.success }]}
                                            onPress={handleSaveResults}
                                        >
                                            <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
                                            <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>Save to Profile</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={[styles.infoBox, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                                    <Ionicons name="information-circle" size={20} color={colors.accent.primary} />
                                    <Text style={[styles.infoText, { color: colors.text.tertiary }]}>
                                        BMR is your resting metabolic rate. TDEE includes your activity level. Adjust your calories based on your goal.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '95%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.xl,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        padding: spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    input: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        fontSize: 16,
    },
    unitLabel: {
        fontSize: 12,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
    },
    genderRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    genderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        gap: spacing.sm,
    },
    genderText: {
        fontSize: 15,
        fontWeight: '600',
    },
    activityList: {
        gap: spacing.sm,
    },
    activityOption: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 2,
    },
    activityText: {
        fontSize: 14,
        fontWeight: '500',
    },
    goalRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    goalButton: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        gap: 4,
    },
    goalText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    goalSubtext: {
        fontSize: 11,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    clearButton: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    calculateButton: {
        flex: 2,
        flexDirection: 'row',
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    calculateButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultsSection: {
        margin: spacing.xl,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    resultRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    resultCard: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    resultValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    resultUnit: {
        fontSize: 11,
        marginTop: 2,
    },
    targetCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    targetLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        opacity: 0.9,
    },
    targetValue: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    targetUnit: {
        fontSize: 13,
        marginTop: 4,
        opacity: 0.9,
    },
    macrosSection: {
        marginTop: spacing.md,
    },
    macrosTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: spacing.md,
    },
    macroRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    macroCard: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    macroValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    macroLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    saveButton: {
        flexDirection: 'row',
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoBox: {
        flexDirection: 'row',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
    },
    unitToggle: {
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
    },
    unitToggleText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
