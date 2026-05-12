import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useTheme } from '../store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

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
        bodyFatPercent?: number | null;
        sleepHours?: string | null;
        mealsPerDay?: number | null;
        goalIntensity?: string | null;
        workoutType?: string | null;
        workoutDuration?: number | null;
        workoutFrequency?: number | null;
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
    bodyFatPercent: number | null;
    sleepHours: string | null;
    mealsPerDay: number | null;
    goalIntensity: string | null;
    workoutType: string | null;
    workoutDuration: number | null;
    workoutFrequency: number | null;
}

export function CalorieCalculator({ visible, onClose, onSave, initialValues }: CalorieCalculatorProps) {
    const { colors } = useTheme();
    const scrollRef = React.useRef<ScrollView>(null);

    // Wizard State
    const [step, setStep] = useState(1);
    const totalSteps = 6;

    // Unit selection
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
    const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>('cm');

    // Stats State
    const [age, setAge] = useState('25');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [heightFt, setHeightFt] = useState('5');
    const [heightIn, setHeightIn] = useState('10');
    const [heightCm, setHeightCm] = useState('178');
    const [weightLbs, setWeightLbs] = useState('165');
    const [weightKg, setWeightKg] = useState('75');
    
    // New Fields
    const [bodyFat, setBodyFat] = useState('');
    const [sleepHours, setSleepHours] = useState('7-8');
    const [mealsPerDay, setMealsPerDay] = useState('3');
    
    const [activityLevel, setActivityLevel] = useState('moderate');
    const [workoutType, setWorkoutType] = useState('none');
    const [workoutDuration, setWorkoutDuration] = useState('45');
    const [workoutFrequency, setWorkoutFrequency] = useState('3');

    const [goal, setGoal] = useState<'cut' | 'bulk' | 'maintain'>('maintain');
    const [goalIntensity, setGoalIntensity] = useState('moderate');

    useEffect(() => {
        if (visible && initialValues) {
            setStep(1); // Reset to first step when opened
            setShowResults(false);
            
            if (initialValues.age) setAge(initialValues.age.toString());
            if (initialValues.gender) setGender(initialValues.gender);

            if (initialValues.height) {
                setHeightCm(initialValues.height.toString());
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
            
            if (initialValues.bodyFatPercent) setBodyFat(initialValues.bodyFatPercent.toString());
            if (initialValues.sleepHours) setSleepHours(initialValues.sleepHours);
            if (initialValues.mealsPerDay) setMealsPerDay(initialValues.mealsPerDay.toString());
            if (initialValues.goalIntensity) setGoalIntensity(initialValues.goalIntensity);
            if (initialValues.workoutType) setWorkoutType(initialValues.workoutType);
            if (initialValues.workoutDuration) setWorkoutDuration(initialValues.workoutDuration.toString());
            if (initialValues.workoutFrequency) setWorkoutFrequency(initialValues.workoutFrequency.toString());
        }
    }, [visible]);

    // Results
    const [bmr, setBmr] = useState(0);
    const [tdee, setTdee] = useState(0);
    const [calorieGoal, setCalorieGoal] = useState(0);
    const [formulaUsed, setFormulaUsed] = useState('');
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (step === 6) {
            handleCalculate();
        }
    }, [step]);

    const activityLevels = [
        { id: 'sedentary', label: 'Desk Job (Little to no exercise)', multiplier: 1.2, icon: 'laptop-outline' },
        { id: 'light', label: 'Lightly Active (Standing/Walking job)', multiplier: 1.375, icon: 'walk-outline' },
        { id: 'moderate', label: 'Moderately Active (Physical job)', multiplier: 1.55, icon: 'bicycle-outline' },
        { id: 'active', label: 'Extremely Active (Heavy physical labor)', multiplier: 1.725, icon: 'barbell-outline' },
    ];

    const calculateBMR = () => {
        const weightInKg = weightUnit === 'lbs' ? (Number(weightLbs) || 165) * 0.453592 : (Number(weightKg) || 75);
        
        if (bodyFat && !isNaN(Number(bodyFat)) && Number(bodyFat) > 0) {
            const lbm = weightInKg * (1 - (Number(bodyFat) / 100));
            setFormulaUsed('Katch-McArdle (LBM)');
            return Math.round(370 + (21.6 * lbm));
        }
        
        setFormulaUsed('Mifflin-St Jeor');
        const ageNum = Number(age) || 25;
        const heightInCm = heightUnit === 'ft'
            ? ((Number(heightFt) || 5) * 12 + (Number(heightIn) || 10)) * 2.54
            : (Number(heightCm) || 178);

        let bmrValue = (10 * weightInKg) + (6.25 * heightInCm) - (5 * ageNum);
        return Math.round(gender === 'male' ? bmrValue + 5 : bmrValue - 161);
    };

    const calculateTDEE = (bmrValue: number) => {
        const activity = activityLevels.find(a => a.id === activityLevel);
        let tdeeValue = bmrValue * (activity?.multiplier || 1.55);
        
        if (sleepHours === '<5') tdeeValue *= 0.95;
        else if (sleepHours === '5-6') tdeeValue *= 0.975;
        
        if (workoutType !== 'none') {
            const duration = Number(workoutDuration) || 45;
            const freq = Number(workoutFrequency) || 3;
            
            let calsPerMin = 0;
            switch(workoutType) {
                case 'weightlifting': calsPerMin = 5; break;
                case 'cardio': calsPerMin = 8; break;
                case 'hiit': calsPerMin = 10; break;
                case 'yoga': calsPerMin = 3; break;
                case 'sports': calsPerMin = 7; break;
            }
            
            const weeklyCals = (calsPerMin * duration) * freq;
            const dailyBonus = weeklyCals / 7;
            tdeeValue += dailyBonus;
        }

        return Math.round(tdeeValue);
    };

    const calculateCalorieGoal = (tdeeValue: number) => {
        if (goal === 'maintain') return tdeeValue;
        
        let modifier = 0;
        if (goal === 'cut') {
            if (goalIntensity === 'conservative') modifier = 0.90;
            else if (goalIntensity === 'moderate') modifier = 0.85;
            else if (goalIntensity === 'aggressive') modifier = 0.80;
            else modifier = 0.75;
        } else if (goal === 'bulk') {
            if (goalIntensity === 'conservative') modifier = 1.05;
            else if (goalIntensity === 'moderate') modifier = 1.10;
            else if (goalIntensity === 'aggressive') modifier = 1.15;
            else modifier = 1.20;
        }
        
        return Math.round(tdeeValue * modifier);
    };

    const calculateMacros = (calories: number) => {
        const weightInLbs = weightUnit === 'lbs' ? Number(weightLbs) : Number(weightKg) * 2.20462;

        let proteinGrams = Math.round(weightInLbs * 0.9);
        const maxProteinGrams = Math.floor((calories * 0.4) / 4);
        proteinGrams = Math.min(proteinGrams, maxProteinGrams);
        proteinGrams = Math.max(proteinGrams, 50);

        let fatGrams = Math.round((calories * 0.25) / 9);
        fatGrams = Math.max(fatGrams, 30);

        const proteinCals = proteinGrams * 4;
        const fatCals = fatGrams * 9;
        let carbGrams = Math.round((calories - proteinCals - fatCals) / 4);
        carbGrams = Math.max(carbGrams, 50);

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

    const handleSaveResults = () => {
        if (onSave && showResults) {
            const m = calculateMacros(calorieGoal);
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
                activityLevel,
                bodyFatPercent: bodyFat ? Number(bodyFat) : null,
                sleepHours,
                mealsPerDay: Number(mealsPerDay),
                goalIntensity,
                workoutType,
                workoutDuration: Number(workoutDuration),
                workoutFrequency: Number(workoutFrequency)
            });
        }
        onClose();
    };

    const macros = showResults ? calculateMacros(calorieGoal) : null;
    const mealsNum = Number(mealsPerDay) || 3;

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border.secondary }]}>
                <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%`, backgroundColor: colors.accent.primary }]} />
            </View>
            <Text style={[styles.stepText, { color: colors.text.secondary }]}>Step {step} of {totalSteps}</Text>
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text.primary }]}>Let's get the basics</Text>
            <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>These stats form the core of your Basal Metabolic Rate (BMR).</Text>

            <Text style={[styles.label, { color: colors.text.secondary }]}>Age & Gender</Text>
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                    placeholder="Age"
                    placeholderTextColor={colors.text.disabled}
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                />
                <View style={{ width: spacing.md }} />
                <View style={[styles.genderRow, { flex: 2 }]}>
                    <TouchableOpacity
                        style={[styles.genderButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }, gender === 'male' && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }]}
                        onPress={() => setGender('male')}
                    >
                        <Text style={[styles.genderText, { color: gender === 'male' ? colors.text.inverse : colors.text.tertiary }]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.genderButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }, gender === 'female' && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }]}
                        onPress={() => setGender('female')}
                    >
                        <Text style={[styles.genderText, { color: gender === 'female' ? colors.text.inverse : colors.text.tertiary }]}>Female</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md }}>
                <Text style={[styles.label, { color: colors.text.secondary, marginTop: 0 }]}>Height & Weight</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity style={[styles.unitToggle, heightUnit === 'ft' && { backgroundColor: colors.accent.primary }]} onPress={() => setHeightUnit('ft')}>
                        <Text style={[styles.unitToggleText, { color: heightUnit === 'ft' ? colors.text.inverse : colors.text.tertiary }]}>ft/lbs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.unitToggle, heightUnit === 'cm' && { backgroundColor: colors.accent.primary }]} onPress={() => {setHeightUnit('cm'); setWeightUnit('kg');}}>
                        <Text style={[styles.unitToggleText, { color: heightUnit === 'cm' ? colors.text.inverse : colors.text.tertiary }]}>cm/kg</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.row}>
                {heightUnit === 'ft' ? (
                    <View style={{ flex: 1, flexDirection: 'row', gap: spacing.sm }}>
                        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]} placeholder="Ft" placeholderTextColor={colors.text.disabled} keyboardType="numeric" value={heightFt} onChangeText={setHeightFt} />
                        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]} placeholder="In" placeholderTextColor={colors.text.disabled} keyboardType="numeric" value={heightIn} onChangeText={setHeightIn} />
                    </View>
                ) : (
                    <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]} placeholder="Height (cm)" placeholderTextColor={colors.text.disabled} keyboardType="numeric" value={heightCm} onChangeText={setHeightCm} />
                )}
                <View style={{ width: spacing.md }} />
                {heightUnit === 'ft' ? (
                    <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]} placeholder="Weight (lbs)" placeholderTextColor={colors.text.disabled} keyboardType="numeric" value={weightLbs} onChangeText={(t) => {setWeightLbs(t); setWeightUnit('lbs');}} />
                ) : (
                    <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]} placeholder="Weight (kg)" placeholderTextColor={colors.text.disabled} keyboardType="numeric" value={weightKg} onChangeText={(t) => {setWeightKg(t); setWeightUnit('kg');}} />
                )}
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text.primary }]}>Body Composition</Text>
            <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>Knowing your body fat percentage activates the clinical Katch-McArdle formula.</Text>

            <Text style={[styles.label, { color: colors.text.secondary }]}>Body Fat % (Optional)</Text>
            <TextInput
                style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary, fontSize: 24, textAlign: 'center', padding: spacing.xl }]}
                placeholder="e.g. 15"
                placeholderTextColor={colors.text.disabled}
                keyboardType="numeric"
                value={bodyFat}
                onChangeText={setBodyFat}
            />
            
            <View style={{ marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.background.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border.secondary }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <Ionicons name="information-circle" size={20} color={colors.accent.primary} />
                    <Text style={{ color: colors.text.primary, fontWeight: 'bold' }}>Why does this matter?</Text>
                </View>
                <Text style={{ color: colors.text.secondary, fontSize: 13, lineHeight: 20 }}>
                    Standard formulas guess your muscle mass based on height and weight. If you're very muscular (or overweight), providing body fat % gives a much more accurate estimate of your resting calorie burn.
                </Text>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text.primary }]}>Daily Habits</Text>
            <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>Your lifestyle and recovery outside of the gym.</Text>

            <Text style={[styles.label, { color: colors.text.secondary }]}>Day Job / Base Activity</Text>
            <View style={{ gap: spacing.sm }}>
                {activityLevels.map((activity) => (
                    <TouchableOpacity
                        key={activity.id}
                        style={[
                            { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, backgroundColor: colors.background.card, borderColor: colors.border.primary },
                            activityLevel === activity.id && { backgroundColor: colors.accent.secondary, borderColor: colors.accent.primary }
                        ]}
                        onPress={() => setActivityLevel(activity.id)}
                    >
                        <Ionicons name={activity.icon as any} size={24} color={activityLevel === activity.id ? colors.text.inverse : colors.text.tertiary} style={{ marginRight: spacing.md }} />
                        <Text style={[{ fontSize: 15, fontWeight: '500', color: colors.text.primary }, activityLevel === activity.id && { color: colors.text.inverse }]}>{activity.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={[styles.row, { marginTop: spacing.lg }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.text.secondary, marginTop: 0 }]}>Sleep (Hours)</Text>
                    <View style={{ borderWidth: 1, borderColor: colors.border.primary, borderRadius: borderRadius.md, overflow: 'hidden' }}>
                        {['<5', '5-6', '7-8', '9+'].map((sleep) => (
                            <TouchableOpacity key={sleep} onPress={() => setSleepHours(sleep)} style={[{ padding: spacing.md, backgroundColor: colors.background.card }, sleepHours === sleep && { backgroundColor: colors.accent.primary }]}>
                                <Text style={{ textAlign: 'center', fontWeight: '600', color: sleepHours === sleep ? colors.text.inverse : colors.text.primary }}>{sleep}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <View style={{ width: spacing.md }} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.text.secondary, marginTop: 0 }]}>Meals / Day</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary, fontSize: 24, textAlign: 'center', padding: 22 }]} keyboardType="numeric" value={mealsPerDay} onChangeText={setMealsPerDay} />
                </View>
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text.primary }]}>Training Plan</Text>
            <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>Let's factor in your workouts to calculate your Total Daily Energy Expenditure (TDEE).</Text>

            <Text style={[styles.label, { color: colors.text.secondary }]}>Primary Workout Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {['none', 'weightlifting', 'cardio', 'hiit', 'yoga', 'sports'].map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.chip, { backgroundColor: colors.background.card, borderColor: colors.border.primary }, workoutType === type && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }]}
                        onPress={() => setWorkoutType(type)}
                    >
                        <Text style={[styles.chipText, { color: workoutType === type ? colors.text.inverse : colors.text.primary, textTransform: 'capitalize' }]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {workoutType !== 'none' && (
                <View style={[styles.row, { marginTop: spacing.xl }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Mins / Session</Text>
                        <TextInput style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary, fontSize: 24, textAlign: 'center' }]} keyboardType="numeric" value={workoutDuration} onChangeText={setWorkoutDuration} />
                    </View>
                    <View style={{ width: spacing.md }} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Days / Week</Text>
                        <TextInput style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary, fontSize: 24, textAlign: 'center' }]} keyboardType="numeric" value={workoutFrequency} onChangeText={setWorkoutFrequency} />
                    </View>
                </View>
            )}
            
            {workoutType === 'none' && (
                <View style={{ marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.background.card, borderRadius: borderRadius.md, alignItems: 'center' }}>
                    <Ionicons name="body-outline" size={48} color={colors.text.disabled} style={{ marginBottom: spacing.md }} />
                    <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>No workouts tracked. We'll use your base activity level to calculate calories.</Text>
                </View>
            )}
        </View>
    );

    const renderStep5 = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text.primary }]}>Your Objective</Text>
            <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>What are we aiming for?</Text>

            <View style={{ gap: spacing.md }}>
                {['cut', 'maintain', 'bulk'].map((g) => {
                    const icons = { cut: 'trending-down', maintain: 'remove', bulk: 'trending-up' };
                    const desc = { cut: 'Lose body fat', maintain: 'Stay at current weight', bulk: 'Build muscle mass' };
                    return (
                        <TouchableOpacity
                            key={g}
                            style={[
                                { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 2, backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                goal === g && { backgroundColor: g === 'cut' ? colors.accent.warning + '15' : g === 'bulk' ? colors.accent.success + '15' : colors.accent.primary + '15', borderColor: g === 'cut' ? colors.accent.warning : g === 'bulk' ? colors.accent.success : colors.accent.primary }
                            ]}
                            onPress={() => setGoal(g as any)}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: g === 'cut' ? colors.accent.warning : g === 'bulk' ? colors.accent.success : colors.accent.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                                <Ionicons name={icons[g as keyof typeof icons] as any} size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={[styles.goalText, { fontSize: 18, color: colors.text.primary, textTransform: 'capitalize' }]}>{g}</Text>
                                <Text style={{ color: colors.text.secondary, fontSize: 13, marginTop: 2 }}>{desc[g as keyof typeof desc]}</Text>
                            </View>
                            {goal === g && <Ionicons name="checkmark-circle" size={24} color={g === 'cut' ? colors.accent.warning : g === 'bulk' ? colors.accent.success : colors.accent.primary} style={{ position: 'absolute', right: spacing.lg }} />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {goal !== 'maintain' && (
                <View style={{ marginTop: spacing.xl }}>
                    <Text style={[styles.label, { color: colors.text.secondary }]}>Pace / Intensity</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                        {[
                            { id: 'conservative', lbl: goal==='cut'?'-10%':'+5%' },
                            { id: 'moderate', lbl: goal==='cut'?'-15%':'+10%' },
                            { id: 'aggressive', lbl: goal==='cut'?'-20%':'+15%' },
                            { id: 'extreme', lbl: goal==='cut'?'-25%':'+20%' }
                        ].map((int) => (
                            <TouchableOpacity
                                key={int.id}
                                style={[
                                    { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1, backgroundColor: colors.background.card, borderColor: colors.border.primary },
                                    goalIntensity === int.id && { backgroundColor: goal === 'cut' ? colors.accent.warning : colors.accent.success, borderColor: goal === 'cut' ? colors.accent.warning : colors.accent.success }
                                ]}
                                onPress={() => setGoalIntensity(int.id)}
                            >
                                <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: goalIntensity === int.id ? '#fff' : colors.text.primary }}>{int.lbl}</Text>
                                <Text style={{ fontSize: 10, textAlign: 'center', color: goalIntensity === int.id ? 'rgba(255,255,255,0.8)' : colors.text.tertiary, textTransform: 'capitalize', marginTop: 2 }}>{int.id}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );

    const renderStep6 = () => (
        <View style={styles.stepContent}>
            <View style={[styles.resultsSection, { backgroundColor: colors.background.elevated, borderColor: colors.border.primary, marginHorizontal: 0 }]}>
                <Text style={[styles.resultTitle, { color: colors.text.primary }]}>Your Results</Text>
                <Text style={{ textAlign: 'center', color: colors.text.tertiary, fontSize: 12, marginBottom: spacing.md }}>Formula: {formulaUsed}</Text>

                <View style={styles.resultRow}>
                    <View style={[styles.resultCard, { backgroundColor: colors.background.card }]}>
                        <Text style={[styles.resultLabel, { color: colors.text.tertiary }]}>BMR</Text>
                        <Text style={[styles.resultValue, { color: colors.accent.primary }]}>{bmr}</Text>
                        <Text style={[styles.resultUnit, { color: colors.text.disabled }]}>cals/day</Text>
                    </View>
                    <View style={[styles.resultCard, { backgroundColor: colors.background.card }]}>
                        <Text style={[styles.resultLabel, { color: colors.text.tertiary }]}>TDEE</Text>
                        <Text style={[styles.resultValue, { color: colors.accent.secondary }]}>{tdee}</Text>
                        <Text style={[styles.resultUnit, { color: colors.text.disabled }]}>cals/day</Text>
                    </View>
                </View>

                <View style={[styles.targetCard, { backgroundColor: colors.accent.primary }]}>
                    <Text style={[styles.targetLabel, { color: colors.text.inverse }]}>Target Calories ({goal})</Text>
                    <Text style={[styles.targetValue, { color: colors.text.inverse }]}>{calorieGoal}</Text>
                    <Text style={[styles.targetUnit, { color: colors.text.inverse }]}>cals / day</Text>
                </View>

                {macros && (
                    <>
                        <Text style={[styles.macrosTitle, { color: colors.text.primary }]}>Daily Macros</Text>
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

                        {mealsNum > 1 && (
                            <View style={{ marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.background.card, borderRadius: borderRadius.md }}>
                                <Text style={{ color: colors.text.primary, fontWeight: 'bold', marginBottom: spacing.xs }}>Per Meal Average ({mealsNum} meals)</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ color: colors.text.secondary }}>Cals: {Math.round(calorieGoal/mealsNum)}</Text>
                                    <Text style={{ color: colors.nutrition.protein }}>P: {Math.round(macros.protein/mealsNum)}g</Text>
                                    <Text style={{ color: colors.nutrition.carbs }}>C: {Math.round(macros.carbs/mealsNum)}g</Text>
                                    <Text style={{ color: colors.nutrition.fats }}>F: {Math.round(macros.fats/mealsNum)}g</Text>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
                        <Text style={[styles.title, { color: colors.text.primary }]}>Calorie Calculator</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                    
                    {renderProgressBar()}

                    <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                        {step === 5 && renderStep5()}
                        {step === 6 && renderStep6()}
                        <View style={{ height: 20 }} />
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: colors.border.secondary, backgroundColor: colors.background.primary }]}>
                        {step > 1 && step < 6 && (
                            <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary, marginRight: spacing.md, width: 60 }]} onPress={() => setStep(step - 1)}>
                                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        )}
                        
                        {step < 5 ? (
                            <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.accent.primary, flex: 1, borderColor: colors.accent.primary }]} onPress={() => setStep(step + 1)}>
                                <Text style={[styles.navButtonText, { color: colors.text.inverse }]}>Next</Text>
                            </TouchableOpacity>
                        ) : step === 5 ? (
                            <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.accent.success, flex: 1, borderColor: colors.accent.success }]} onPress={() => setStep(6)}>
                                <Ionicons name="calculator" size={20} color={colors.text.inverse} style={{ marginRight: 8 }} />
                                <Text style={[styles.navButtonText, { color: colors.text.inverse }]}>Calculate</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ flexDirection: 'row', flex: 1, gap: spacing.md }}>
                                <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary, flex: 1 }]} onPress={() => setStep(1)}>
                                    <Text style={[styles.navButtonText, { color: colors.text.primary }]}>Recalculate</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.accent.success, flex: 2, borderColor: colors.accent.success }]} onPress={handleSaveResults}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} style={{ marginRight: 8 }} />
                                    <Text style={[styles.navButtonText, { color: colors.text.inverse }]}>Save Profile</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, height: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1 },
    title: { fontSize: 22, fontWeight: 'bold' },
    progressContainer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    stepText: { fontSize: 12, fontWeight: 'bold' },
    stepContent: { padding: spacing.xl },
    stepTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    stepSubtitle: { fontSize: 14, marginBottom: spacing.xl, lineHeight: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, fontSize: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    genderRow: { flexDirection: 'row', gap: spacing.md },
    genderButton: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1 },
    genderText: { fontSize: 16, fontWeight: '600' },
    unitToggle: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.sm, borderWidth: 1 },
    unitToggleText: { fontSize: 12, fontWeight: '600' },
    chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 1, marginBottom: spacing.sm },
    chipText: { fontSize: 15, fontWeight: '500' },
    goalRow: { flexDirection: 'row', gap: spacing.md },
    goalButton: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1 },
    goalText: { fontSize: 14, fontWeight: '600' },
    footer: { padding: spacing.xl, paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl, borderTopWidth: 1, flexDirection: 'row' },
    navButton: { flexDirection: 'row', padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    navButtonText: { fontSize: 16, fontWeight: 'bold' },
    resultsSection: { padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1 },
    resultTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    resultRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    resultCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    resultLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    resultValue: { fontSize: 24, fontWeight: 'bold' },
    resultUnit: { fontSize: 11, marginTop: 2 },
    targetCard: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.lg },
    targetLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4, opacity: 0.9 },
    targetValue: { fontSize: 36, fontWeight: 'bold' },
    targetUnit: { fontSize: 13, marginTop: 4, opacity: 0.9 },
    macrosTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md },
    macroRow: { flexDirection: 'row', gap: spacing.md },
    macroCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    macroValue: { fontSize: 20, fontWeight: 'bold' },
    macroLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 }
});
