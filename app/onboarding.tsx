import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../src/store/useUserStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { ActivityLevel, FitnessGoal, UserProfile } from '../src/types';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Colors Palette
const COLORS = {
    background: '#0A0A0F',
    card: '#1B1B29',
    primary: '#8B5CF6',
    secondary: '#EC4899',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    border: '#2D2D44',
    inputBg: '#13131F'
};

// Helper function to calculate targets locally
function calculateUserTargets(profile: Partial<UserProfile>): Partial<UserProfile> {
    const { age = 25, gender = 'male', height = 175, weight = 70, activityLevel = 'moderate', goal = 'maintain' } = profile;

    // Mifflin-St Jeor BMR
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    // Activity multipliers
    const multipliers: Record<ActivityLevel, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
    };

    const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55));

    // Goal adjustments
    let calorieGoal = tdee;
    if (goal === 'cut') calorieGoal = Math.round(tdee * 0.85); // 15% deficit
    if (goal === 'bulk') calorieGoal = Math.round(tdee * 1.10); // 10% surplus

    // Macro calculation (0.9g protein per lb, 25% fat, rest carbs)
    const weightInLbs = weight * 2.20462;

    // Safety caps
    let targetProtein = Math.round(weightInLbs * 0.9);
    const maxProtein = Math.floor((calorieGoal * 0.4) / 4);
    targetProtein = Math.min(targetProtein, maxProtein);
    targetProtein = Math.max(targetProtein, 50);

    const targetFats = Math.max(Math.round((calorieGoal * 0.25) / 9), 30);
    const targetCarbs = Math.max(Math.round((calorieGoal - (targetProtein * 4) - (targetFats * 9)) / 4), 50);

    return {
        ...profile,
        calorieGoal,
        targetProtein,
        targetCarbs,
        targetFats,
    };
}

export default function OnboardingScreen() {
    const updateProfile = useUserStore((s) => s.updateProfile);
    const setTempProfileData = useUserStore((s) => s.setTempProfileData);
    const { user: authUser } = useAuthStore();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: authUser?.name || '',
        age: '25',
        gender: 'male' as const,
        height: '175', // cm
        weight: '70', // kg
        activityLevel: 'moderate' as ActivityLevel,
        goal: 'maintain' as FitnessGoal,
    });

    // Extra state for interactions (not saved to DB yet)
    const [interests, setInterests] = useState<string[]>([]);

    // Unit Toggles
    const [units, setUnits] = useState({
        weight: 'kg' as 'kg' | 'lbs',
        height: 'cm' as 'cm' | 'ft',
    });

    const updateForm = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleInterest = (interest: string) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const toggleWeightUnit = () => {
        const currentW = Number(formData.weight);
        if (!currentW) {
            setUnits(prev => ({ ...prev, weight: prev.weight === 'kg' ? 'lbs' : 'kg' }));
            return;
        }
        if (units.weight === 'kg') {
            const lbs = (currentW * 2.20462).toFixed(1);
            updateForm('weight', lbs);
            setUnits(prev => ({ ...prev, weight: 'lbs' }));
        } else {
            const kg = (currentW / 2.20462).toFixed(1);
            updateForm('weight', kg.endsWith('.0') ? kg.slice(0, -2) : kg);
            setUnits(prev => ({ ...prev, weight: 'kg' }));
        }
    };

    const toggleHeightUnit = () => {
        const currentH = Number(formData.height);
        if (!currentH) {
            setUnits(prev => ({ ...prev, height: prev.height === 'cm' ? 'ft' : 'cm' }));
            return;
        }
        if (units.height === 'cm') {
            const ft = (currentH / 30.48).toFixed(2);
            updateForm('height', ft);
            setUnits(prev => ({ ...prev, height: 'ft' }));
        } else {
            const cm = (currentH * 30.48).toFixed(0);
            updateForm('height', cm);
            setUnits(prev => ({ ...prev, height: 'cm' }));
        }
    };

    const handleFinish = async () => {
        try {
            let finalWeight = Number(formData.weight) || 70;
            let finalHeight = Number(formData.height) || 175;

            // Normalize to Metric for DB
            if (units.weight === 'lbs') finalWeight /= 2.20462;
            if (units.height === 'ft') finalHeight *= 30.48;

            const finalProfile = {
                ...formData,
                age: Number(formData.age) || 25,
                height: Math.round(finalHeight),
                weight: Math.round(finalWeight),
            };

            const profileWithTargets = calculateUserTargets(finalProfile);

            // Save to temp store for Login screen to pick up
            setTempProfileData(profileWithTargets);

            // Navigate to Login Page
            router.replace('/auth/login');
        } catch (error) {
            console.error("Failed to save profile:", error);
        }
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} />
            </View>
            <Text style={styles.stepText}>Step {step} of 5</Text>
        </View>
    );

    // STEP 1: Intro
    const renderIntro = () => (
        <View style={styles.stepContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Let's tailor your experience.</Text>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={COLORS.textSecondary}
                    value={formData.name}
                    onChangeText={(t) => updateForm('name', t)}
                    autoFocus
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.row}>
                    {['male', 'female'].map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.card, formData.gender === g && styles.cardActive]}
                            onPress={() => updateForm('gender', g)}
                        >
                            <Ionicons name={g === 'male' ? 'male' : 'female'} size={24} color={formData.gender === g ? '#fff' : COLORS.textSecondary} />
                            <Text style={[styles.cardText, formData.gender === g && styles.cardTextActive]}>
                                {g === 'male' ? 'Male' : 'Female'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.replace('/auth/login')}
            >
                <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkHighlight}>Log In</Text></Text>
            </TouchableOpacity>
        </View>
    );

    // STEP 2: Body Stats
    const renderStats = () => (
        <View style={styles.stepContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Body Stats</Text>
                <Text style={styles.subtitle}>For accurate calculations.</Text>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={formData.age}
                    onChangeText={(t) => updateForm('age', t)}
                    placeholder="25"
                    placeholderTextColor={COLORS.textSecondary}
                    maxLength={3}
                />
            </View>

            <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                    <Text style={styles.label}>Height</Text>
                    <TouchableOpacity onPress={toggleHeightUnit} style={styles.unitToggle}>
                        <Text style={[styles.unitText, units.height === 'cm' && styles.unitTextActive]}>CM</Text>
                        <View style={styles.unitDivider} />
                        <Text style={[styles.unitText, units.height === 'ft' && styles.unitTextActive]}>FT</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={formData.height}
                    onChangeText={(t) => updateForm('height', t)}
                    placeholder={units.height === 'cm' ? "175" : "5.7"}
                    placeholderTextColor={COLORS.textSecondary}
                    maxLength={6}
                />
            </View>

            <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                    <Text style={styles.label}>Weight</Text>
                    <TouchableOpacity onPress={toggleWeightUnit} style={styles.unitToggle}>
                        <Text style={[styles.unitText, units.weight === 'kg' && styles.unitTextActive]}>KG</Text>
                        <View style={styles.unitDivider} />
                        <Text style={[styles.unitText, units.weight === 'lbs' && styles.unitTextActive]}>LBS</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={formData.weight}
                    onChangeText={(t) => updateForm('weight', t)}
                    placeholder={units.weight === 'kg' ? "70" : "154"}
                    placeholderTextColor={COLORS.textSecondary}
                    maxLength={6}
                />
            </View>
        </View>
    );

    // STEP 3: Lifestyle (Activity)
    const renderLifestyle = () => {
        const lifestyles = [
            { id: 'sedentary', label: 'Desk Job', icon: 'laptop-outline', desc: 'Little to no exercise' },
            { id: 'light', label: 'Lightly Active', icon: 'walk-outline', desc: 'Standing/Walking job' },
            { id: 'moderate', label: 'Active', icon: 'bicycle-outline', desc: 'Physical job or daily exercise' },
            { id: 'active', label: 'Very Active', icon: 'barbell-outline', desc: 'Heavy physical labor' },
        ];

        return (
            <View style={styles.stepContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Lifestyle</Text>
                    <Text style={styles.subtitle}>How active is your day-to-day?</Text>
                </View>
                <View style={styles.grid}>
                    {lifestyles.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.bigCard, formData.activityLevel === item.id && styles.bigCardActive]}
                            onPress={() => updateForm('activityLevel', item.id)}
                        >
                            <View style={[styles.iconCircle, formData.activityLevel === item.id && styles.iconCircleActive]}>
                                <Ionicons name={item.icon as any} size={28} color={formData.activityLevel === item.id ? '#fff' : COLORS.primary} />
                            </View>
                            <Text style={[styles.bigCardTitle, formData.activityLevel === item.id && styles.bigCardTitleActive]}>{item.label}</Text>
                            <Text style={styles.bigCardDesc}>{item.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // STEP 4: Interests
    const renderInterests = () => {
        const options = [
            { id: 'strength', label: 'Strength', icon: 'barbell' },
            { id: 'cardio', label: 'Cardio', icon: 'heart' },
            { id: 'yoga', label: 'Yoga', icon: 'body' },
            { id: 'hiit', label: 'HIIT', icon: 'timer' },
        ];

        return (
            <View style={styles.stepContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Interests</Text>
                    <Text style={styles.subtitle}>What do you enjoy? (Select all)</Text>
                </View>
                <View style={styles.grid}>
                    {options.map((item) => {
                        const isSelected = interests.includes(item.id);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.bigCard, isSelected && styles.bigCardActive]}
                                onPress={() => toggleInterest(item.id)}
                            >
                                <View style={[styles.iconCircle, isSelected && styles.iconCircleActive]}>
                                    <Ionicons name={item.icon as any} size={28} color={isSelected ? '#fff' : COLORS.primary} />
                                </View>
                                <Text style={[styles.bigCardTitle, isSelected && styles.bigCardTitleActive]}>{item.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    // STEP 5: Goal
    const renderGoal = () => {
        const goals = [
            { id: 'cut', label: 'Lose Weight', icon: 'flame', desc: 'Caloric Deficit' },
            { id: 'maintain', label: 'Keep Fit', icon: 'pulse', desc: 'Maintenance' },
            { id: 'bulk', label: 'Build Muscle', icon: 'trophy', desc: 'Caloric Surplus' },
        ];

        return (
            <View style={styles.stepContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Main Goal</Text>
                    <Text style={styles.subtitle}>What is your primary focus?</Text>
                </View>
                <View style={styles.list}>
                    {goals.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.goalRow, formData.goal === item.id && styles.goalRowActive]}
                            onPress={() => updateForm('goal', item.id)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: formData.goal === item.id ? COLORS.primary : '#2d2d44' }]}>
                                <Ionicons name={item.icon as any} size={24} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.goalRowTitle, formData.goal === item.id && styles.goalRowTitleActive]}>{item.label}</Text>
                                <Text style={styles.goalRowDesc}>{item.desc}</Text>
                            </View>
                            {formData.goal === item.id && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.safeArea}>
                {renderProgressBar()}

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {step === 1 && renderIntro()}
                    {step === 2 && renderStats()}
                    {step === 3 && renderLifestyle()}
                    {step === 4 && renderInterests()}
                    {step === 5 && renderGoal()}
                </ScrollView>

                <View style={styles.footer}>
                    {step > 1 && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setStep(step - 1)}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.nextButton,
                            !formData.name && step === 1 && styles.buttonDisabled
                        ]}
                        onPress={() => {
                            if (step < 5) setStep(step + 1);
                            else handleFinish();
                        }}
                        disabled={!formData.name && step === 1}
                    >
                        <Text style={styles.nextButtonText}>{step === 5 ? "Finish" : "Next"}</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    safeArea: { flex: 1, paddingTop: 50 },
    progressContainer: { paddingHorizontal: 24, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
    progressBar: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2 },
    progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
    stepText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 100 },
    stepContent: { flex: 1 },
    header: { marginBottom: 32 },
    title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 24 },
    formGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    input: { backgroundColor: COLORS.inputBg, borderRadius: 16, padding: 18, color: COLORS.text, fontSize: 16, borderWidth: 1, borderColor: COLORS.border },
    row: { flexDirection: 'row', gap: 12 },
    card: { flex: 1, backgroundColor: COLORS.card, padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 10 },
    cardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(139, 92, 246, 0.1)' },
    cardText: { color: COLORS.textSecondary, fontWeight: '600' },
    cardTextActive: { color: COLORS.text },
    loginLink: { marginTop: 20, alignItems: 'center', padding: 10 },
    loginLinkText: { fontSize: 14, color: COLORS.textSecondary },
    loginLinkHighlight: { color: COLORS.primary, fontWeight: 'bold' },
    unitToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: COLORS.border },
    unitText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, paddingHorizontal: 8, paddingVertical: 2 },
    unitTextActive: { color: '#fff', backgroundColor: COLORS.primary, borderRadius: 4, overflow: 'hidden' },
    unitDivider: { width: 1, height: 12, backgroundColor: COLORS.border },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    bigCard: { width: '48%', backgroundColor: COLORS.card, padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
    bigCardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(139, 92, 246, 0.1)' },
    iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(139, 92, 246, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    iconCircleActive: { backgroundColor: COLORS.primary },
    bigCardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4, textAlign: 'center' },
    bigCardTitleActive: { color: COLORS.primary },
    bigCardDesc: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
    list: { gap: 12 },
    goalRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, gap: 16 },
    goalRowActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(139, 92, 246, 0.1)' },
    goalRowTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    goalRowTitleActive: { color: COLORS.primary },
    goalRowDesc: { fontSize: 13, color: COLORS.textSecondary },
    iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border },
    backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: COLORS.card, marginRight: 16 },
    nextButton: { flex: 1, flexDirection: 'row', height: 56, backgroundColor: COLORS.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
    buttonDisabled: { opacity: 0.5 },
    nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
