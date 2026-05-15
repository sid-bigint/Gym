import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView,
    Platform, TouchableOpacity, Dimensions, Animated, Keyboard
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useUserStore } from '../src/store/useUserStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { ActivityLevel, FitnessGoal, UserProfile } from '../src/types';

const { width, height } = Dimensions.get('window');

// Premium Green Theme from Login
const GREEN = '#22C55E';
const GREEN_DIM = 'rgba(34,197,94,0.18)';
const GREEN_BORDER = 'rgba(34,197,94,0.25)';
const BG_DARK = '#080A0C';

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

    let targetFats = Math.round((calorieGoal * 0.25) / 9);
    targetFats = Math.max(targetFats, 30);
    
    let targetCarbs = Math.round((calorieGoal - (targetProtein * 4) - (targetFats * 9)) / 4);
    targetCarbs = Math.max(targetCarbs, 50);

    return {
        ...profile,
        calorieGoal,
        targetProtein,
        targetCarbs,
        targetFats,
    };
}

const ScrollPicker = ({ value, onChange, min, max, unit, step = 1 }: { value: string, onChange: (val: string) => void, min: number, max: number, unit?: string, step?: number }) => {
    const items: number[] = [];
    for(let i=min; i<=max; i+=step) {
        items.push(Number(i.toFixed(1)));
    }
    const ITEM_WIDTH = 80;
    const padding = (width - 48 - ITEM_WIDTH) / 2; 

    const numericValue = Number(value) || min;
    let initialIndex = 0;
    let minDiff = Infinity;
    items.forEach((item, idx) => {
        const diff = Math.abs(item - numericValue);
        if (diff < minDiff) {
            minDiff = diff;
            initialIndex = idx;
        }
    });
    
    return (
        <View style={{ height: 100, justifyContent: 'center', alignItems: 'center', marginVertical: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: padding }}
                contentOffset={{ x: initialIndex > 0 ? initialIndex * ITEM_WIDTH : 0, y: 0 }}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
                    if (items[index] !== undefined) {
                        onChange(items[index].toString());
                    }
                }}
            >
                {items.map((val) => (
                    <View key={val} style={{ width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ 
                            fontSize: Math.abs(numericValue - val) <= (step/2) ? 36 : 20, 
                            color: Math.abs(numericValue - val) <= (step/2) ? GREEN : 'rgba(255,255,255,0.2)', 
                            fontWeight: '900' 
                        }}>{val}</Text>
                    </View>
                ))}
            </ScrollView>
            <View style={{ position: 'absolute', pointerEvents: 'none', width: ITEM_WIDTH, height: 60, borderTopWidth: 2, borderBottomWidth: 2, borderColor: GREEN }} />
            {unit && <Text style={{ position: 'absolute', right: 20, color: GREEN, fontWeight: '700' }}>{unit}</Text>}
        </View>
    );
};

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

    const [interests, setInterests] = useState<string[]>([]);
    const [units, setUnits] = useState({
        weight: 'kg' as 'kg' | 'lbs',
        height: 'cm' as 'cm' | 'ft',
    });
    const [scheduledDay, setScheduledDay] = useState('today');

    const scrollViewRef = useRef<ScrollView>(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // Animations
    const beamX = useRef(new Animated.Value(-width)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;
    
    // Logo Animations (Step 1 only)
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Initial entrance
        animateStepChange();

        // Beam loop
        const runBeam = () => {
            beamX.setValue(-width);
            Animated.timing(beamX, { toValue: width, duration: 2800, useNativeDriver: true }).start(({ finished }) => {
                if (finished) setTimeout(runBeam, 1500);
            });
        };
        runBeam();

        // Ring pulse loop
        const ringPulse = Animated.loop(
            Animated.sequence([
                Animated.timing(ringScale, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
                Animated.timing(ringScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        );
        ringPulse.start();

        const kbdShow = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
        const kbdHide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            ringPulse.stop();
            kbdShow.remove();
            kbdHide.remove();
        };
    }, []);

    // Trigger animation whenever step changes
    useEffect(() => {
        animateStepChange();
        // Reset scroll position on step change
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [step]);

    const animateStepChange = () => {
        // Reset values before starting
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        
        const animations = [
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.spring(progressWidth, { 
                toValue: (step / 6) * 100, 
                tension: 25, 
                friction: 8, 
                useNativeDriver: false 
            })
        ];

        if (step === 1) {
            animations.push(
                Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true })
            );
        }

        Animated.parallel(animations).start();
    };

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

    const handleNext = () => {
        if (step < 6) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleFinish = async () => {
        try {
            let finalWeight = Number(formData.weight) || 70;
            let finalHeight = Number(formData.height) || 175;

            if (units.weight === 'lbs') finalWeight /= 2.20462;
            if (units.height === 'ft') finalHeight *= 30.48;

            const finalProfile = {
                ...formData,
                age: Number(formData.age) || 25,
                height: Math.round(finalHeight),
                weight: Math.round(finalWeight),
            };

            const profileWithTargets = calculateUserTargets(finalProfile);
            
            // Scheduling Notification
            if (scheduledDay !== 'later') {
                const { status } = await Notifications.getPermissionsAsync();
                let finalStatus = status;
                if (status !== 'granted') {
                    const { status: newStatus } = await Notifications.requestPermissionsAsync();
                    finalStatus = newStatus;
                }
                if (finalStatus === 'granted') {
                    const trigger = new Date();
                    if (scheduledDay === 'tomorrow') {
                        trigger.setDate(trigger.getDate() + 1);
                    }
                    trigger.setHours(17, 0, 0, 0); // 5 PM
                    if (scheduledDay === 'today' && new Date() > trigger) {
                        trigger.setHours(new Date().getHours() + 1); // If past 5PM, set for 1 hour from now
                    }

                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: "Time to crush it! 💪",
                            body: "Your first session is waiting. Let's build that streak.",
                        },
                        trigger: { 
                            type: Notifications.SchedulableTriggerInputTypes.DATE, 
                            date: trigger 
                        },
                    });
                }
            }

            // Since we are already authenticated (via Google or Guest), we update directly
            await updateProfile(profileWithTargets);
            
            router.replace('/(tabs)');
        } catch (error) {
            console.error("Failed to save profile:", error);
        }
    };

    const renderHeader = (title: string, sub: string) => (
        <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.subtitle}>{sub}</Text>
        </View>
    );

    const renderProgressBar = () => (
        <View style={s.progressContainer}>
            <View style={s.progressBarTrack}>
                <Animated.View style={[s.progressFill, { 
                    width: progressWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%']
                    }) 
                }]} />
            </View>
            <Text style={s.stepText}>STEP {step}/6</Text>
        </View>
    );

    // STEP 2: Intro
    const renderIntro = () => (
        <View style={s.stepContent}>

            {renderHeader("Welcome Athlete", "Let's personalize your training journey.")}

            <View style={s.formGroup}>
                <Text style={s.label}>What should we call you?</Text>
                <TextInput
                    style={s.input}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={formData.name}
                    onChangeText={(t) => updateForm('name', t)}
                    autoFocus
                />
            </View>


            <View style={s.formGroup}>
                <Text style={s.label}>Gender</Text>
                <View style={s.row}>
                    {['male', 'female'].map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={[s.optionCard, formData.gender === g && s.optionCardActive]}
                            onPress={() => updateForm('gender', g)}
                        >
                            <Ionicons 
                                name={g === 'male' ? 'male' : 'female'} 
                                size={24} 
                                color={formData.gender === g ? GREEN : 'rgba(255,255,255,0.3)'} 
                            />
                            <Text style={[s.optionText, formData.gender === g && s.optionTextActive]}>
                                {g === 'male' ? 'Male' : 'Female'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

        </View>
    );

    // STEP 3: Stats
    const renderStats = () => (
        <View style={s.stepContent}>
            {renderHeader("Vital Stats", "These help us calculate your targets.")}

            <View style={s.formGroup}>
                <Text style={s.label}>Age</Text>
                <ScrollPicker 
                    value={formData.age} 
                    onChange={(t) => updateForm('age', t)} 
                    min={14} max={100} unit="YRS" 
                />
            </View>

            <View style={s.formGroup}>
                <View style={s.labelRow}>
                    <Text style={s.label}>Height</Text>
                    <TouchableOpacity onPress={toggleHeightUnit} style={s.unitToggle}>
                        <Text style={[s.unitText, units.height === 'cm' && s.unitTextActive]}>CM</Text>
                        <Text style={[s.unitText, units.height === 'ft' && s.unitTextActive]}>FT</Text>
                    </TouchableOpacity>
                </View>
                <ScrollPicker 
                    value={formData.height} 
                    onChange={(t) => updateForm('height', t)} 
                    min={units.height === 'cm' ? 120 : 4} 
                    max={units.height === 'cm' ? 220 : 7.5} 
                    step={units.height === 'cm' ? 1 : 0.1}
                    unit={units.height.toUpperCase()} 
                />
            </View>

            <View style={s.formGroup}>
                <View style={s.labelRow}>
                    <Text style={s.label}>Weight</Text>
                    <TouchableOpacity onPress={toggleWeightUnit} style={s.unitToggle}>
                        <Text style={[s.unitText, units.weight === 'kg' && s.unitTextActive]}>KG</Text>
                        <Text style={[s.unitText, units.weight === 'lbs' && s.unitTextActive]}>LBS</Text>
                    </TouchableOpacity>
                </View>
                <ScrollPicker 
                    value={formData.weight} 
                    onChange={(t) => updateForm('weight', t)} 
                    min={units.weight === 'kg' ? 40 : 88} 
                    max={units.weight === 'kg' ? 200 : 440} 
                    step={1}
                    unit={units.weight.toUpperCase()} 
                />
            </View>
        </View>
    );

    // STEP 3: Lifestyle
    const renderLifestyle = () => {
        const items = [
            { id: 'sedentary', label: 'Sedentary', icon: 'bed-outline', desc: 'Little/no exercise' },
            { id: 'light', label: 'Lightly Active', icon: 'walk-outline', desc: '1-3 days/week' },
            { id: 'moderate', label: 'Moderately Active', icon: 'fitness-outline', desc: '3-5 days/week' },
            { id: 'active', label: 'Very Active', icon: 'flame-outline', desc: '6-7 days/week' },
        ];

        return (
            <View style={s.stepContent}>
                {renderHeader("Daily Lifestyle", "How active are you day-to-day?")}
                <View style={s.grid}>
                    {items.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[s.bigCard, formData.activityLevel === item.id && s.bigCardActive]}
                            onPress={() => updateForm('activityLevel', item.id)}
                        >
                            <View style={[s.iconCircle, formData.activityLevel === item.id && s.iconCircleActive]}>
                                <Ionicons name={item.icon as any} size={28} color={formData.activityLevel === item.id ? '#fff' : GREEN} />
                            </View>
                            <Text style={[s.bigCardTitle, formData.activityLevel === item.id && s.bigCardTitleActive]}>{item.label}</Text>
                            <Text style={s.bigCardDesc}>{item.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // STEP 5: Your Plan is Ready
    const renderPlanReady = () => {
        const targets = calculateUserTargets({
            ...formData,
            age: Number(formData.age) || 25,
            height: units.height === 'ft' ? (Number(formData.height) * 30.48) : Number(formData.height),
            weight: units.weight === 'lbs' ? (Number(formData.weight) / 2.20462) : Number(formData.weight),
        });
        
        return (
            <View style={s.stepContent}>
                {renderHeader("Your Plan is Ready", "Here is your personalized roadmap.")}
                
                <View style={[s.bigCard, { width: '100%', alignItems: 'flex-start' }]}>
                    <Text style={{color: GREEN, fontSize: 14, fontWeight: '700', marginBottom: 10}}>DAILY TARGET</Text>
                    <Text style={{color: '#fff', fontSize: 36, fontWeight: '900', marginBottom: 20}}>
                        {targets.calorieGoal} <Text style={{fontSize: 16, color: 'rgba(255,255,255,0.4)'}}>kcal</Text>
                    </Text>
                    
                    <Text style={{color: GREEN, fontSize: 14, fontWeight: '700', marginBottom: 10}}>MACROS</Text>
                    <View style={{flexDirection: 'row', gap: 20}}>
                        <View>
                            <Text style={{color: 'rgba(255,255,255,0.4)', fontSize: 12}}>Protein</Text>
                            <Text style={{color: '#fff', fontSize: 18, fontWeight: '700'}}>{targets.targetProtein}g</Text>
                        </View>
                        <View>
                            <Text style={{color: 'rgba(255,255,255,0.4)', fontSize: 12}}>Carbs</Text>
                            <Text style={{color: '#fff', fontSize: 18, fontWeight: '700'}}>{targets.targetCarbs}g</Text>
                        </View>
                        <View>
                            <Text style={{color: 'rgba(255,255,255,0.4)', fontSize: 12}}>Fats</Text>
                            <Text style={{color: '#fff', fontSize: 18, fontWeight: '700'}}>{targets.targetFats}g</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    // STEP 1: Goal
    const renderGoal = () => {
        const goals = [
            { id: 'cut', label: 'Lose Weight', icon: 'flame', desc: 'Burn fat and get lean' },
            { id: 'maintain', label: 'Maintain', icon: 'pulse', desc: 'Stay fit and healthy' },
            { id: 'bulk', label: 'Build Muscle', icon: 'trophy', desc: 'Gain size and strength' },
        ];

        return (
            <View style={s.stepContent}>
                {renderHeader("Primary Goal", "What is your main focus?")}
                <View style={s.list}>
                    {goals.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[s.goalRow, formData.goal === item.id && s.goalRowActive]}
                            onPress={() => updateForm('goal', item.id)}
                        >
                            <View style={[s.goalIconBox, { backgroundColor: formData.goal === item.id ? GREEN : 'rgba(255,255,255,0.05)' }]}>
                                <Ionicons name={item.icon as any} size={24} color={formData.goal === item.id ? '#000' : GREEN} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.goalTitle, formData.goal === item.id && s.goalTitleActive]}>{item.label}</Text>
                                <Text style={s.goalDesc}>{item.desc}</Text>
                            </View>
                            {formData.goal === item.id && <Ionicons name="checkmark-circle" size={24} color={GREEN} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // STEP 6: Schedule Session
    const renderScheduleSession = () => {
        return (
            <View style={s.stepContent}>
                {renderHeader("Commit to Your First Session", "When will you crush your first workout?")}
                <View style={s.list}>
                    {[
                        { id: 'today', label: 'Today', icon: 'today' },
                        { id: 'tomorrow', label: 'Tomorrow', icon: 'calendar' },
                        { id: 'later', label: 'I\'ll decide later', icon: 'time' },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[s.goalRow, scheduledDay === item.id && s.goalRowActive]}
                            onPress={() => setScheduledDay(item.id)}
                        >
                            <View style={[s.goalIconBox, { backgroundColor: scheduledDay === item.id ? GREEN : 'rgba(255,255,255,0.05)' }]}>
                                <Ionicons name={item.icon as any} size={24} color={scheduledDay === item.id ? '#000' : GREEN} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.goalTitle, scheduledDay === item.id && s.goalTitleActive]}>{item.label}</Text>
                            </View>
                            {scheduledDay === item.id && <Ionicons name="checkmark-circle" size={24} color={GREEN} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={[BG_DARK, '#0C0F12', BG_DARK]} style={StyleSheet.absoluteFillObject} />
            
            {/* Accents from Login */}
            <View style={s.orb1} />
            <View style={s.orb2} />
            <View style={s.cornerTL} />
            <View style={s.cornerBR} />

            {/* Top Beam */}
            <View style={s.beamTrack} pointerEvents="none">
                <Animated.View style={[s.beam, { transform: [{ translateX: beamX }] }]} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={s.safeArea}>
                    {renderProgressBar()}

                    <ScrollView 
                        ref={scrollViewRef}
                        contentContainerStyle={s.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View style={{ 
                            opacity: fadeAnim, 
                            transform: [{ translateY: slideAnim }] 
                        }}>
                            {step === 1 && renderGoal()}
                            {step === 2 && renderIntro()}
                            {step === 3 && renderStats()}
                            {step === 4 && renderLifestyle()}
                            {step === 5 && renderPlanReady()}
                            {step === 6 && renderScheduleSession()}
                        </Animated.View>
                    </ScrollView>

                    {/* Footer Nav */}
                    {!isKeyboardVisible && (
                        <View style={s.footer}>
                            {step > 1 && (
                                <TouchableOpacity style={s.btnBack} onPress={handleBack}>
                                    <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.5)" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                                style={[s.btnNext, (!formData.name && step === 2) && { opacity: 0.5 }]} 
                                onPress={handleNext}
                                disabled={!formData.name && step === 2}
                            >
                                <Text style={s.btnNextText}>{step === 6 ? "FINISH" : "NEXT"}</Text>
                                <Ionicons name={step === 6 ? "checkmark-done" : "arrow-forward"} size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG_DARK },
    safeArea: { flex: 1, paddingTop: 60 },
    orb1: {
        position: 'absolute', top: height * 0.05, left: -width * 0.2,
        width: width * 0.55, height: width * 0.55, borderRadius: width * 0.275,
        backgroundColor: GREEN, opacity: 0.05,
    },
    orb2: {
        position: 'absolute', bottom: height * 0.08, right: -width * 0.2,
        width: width * 0.45, height: width * 0.45, borderRadius: width * 0.225,
        backgroundColor: GREEN, opacity: 0.03,
    },
    cornerTL: {
        position: 'absolute', top: 0, left: 0, width: 100, height: 100,
        borderTopWidth: 1, borderLeftWidth: 1, borderTopColor: GREEN_BORDER, borderLeftColor: GREEN_BORDER,
        borderBottomRightRadius: 80,
    },
    cornerBR: {
        position: 'absolute', bottom: 0, right: 0, width: 70, height: 70,
        borderBottomWidth: 1, borderRightWidth: 1, borderBottomColor: 'rgba(34,197,94,0.1)', borderRightColor: 'rgba(34,197,94,0.1)',
        borderTopLeftRadius: 60,
    },
    beamTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden' },
    beam: { width: width * 0.6, height: 2, backgroundColor: GREEN, opacity: 0.7 },
    // Logo from Login
    logoWrap: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
    iconWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    iconRing: {
        position: 'absolute', inset: -8,
        width: 88, height: 88, borderRadius: 28,
        borderWidth: 1, borderColor: GREEN_BORDER,
    },
    iconBox: {
        width: 72, height: 72, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
    },
    logoName: {
        fontWeight: '900', fontSize: 32, color: '#fff',
        letterSpacing: 4, lineHeight: 36,
    },

    progressContainer: { paddingHorizontal: 24, marginBottom: 30, flexDirection: 'row', alignItems: 'center', gap: 15 },
    progressBarTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: GREEN },
    stepText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
    stepContent: { width: '100%' },
    header: { marginBottom: 32 },
    title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 1, marginBottom: 8 },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 22 },

    formGroup: { marginBottom: 28 },
    label: { fontSize: 12, fontWeight: '700', color: GREEN, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    input: { 
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 18, 
        color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' 
    },
    row: { flexDirection: 'row', gap: 12 },
    
    optionCard: { 
        flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 18, 
        alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 10 
    },
    optionCardActive: { borderColor: GREEN, backgroundColor: GREEN_DIM },
    optionText: { color: 'rgba(255,255,255,0.3)', fontWeight: '700' },
    optionTextActive: { color: '#fff' },

    unitToggle: { flexDirection: 'row', gap: 5 },
    unitText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.2)' },
    unitTextActive: { color: GREEN },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    bigCard: { 
        width: (width - 60) / 2, backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, 
        borderRadius: 22, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 4 
    },
    bigCardActive: { borderColor: GREEN, backgroundColor: GREEN_DIM },
    iconCircle: { 
        width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(34,197,94,0.05)', 
        alignItems: 'center', justifyContent: 'center', marginBottom: 12 
    },
    iconCircleActive: { backgroundColor: GREEN },
    bigCardTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
    bigCardTitleActive: { color: GREEN },
    bigCardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

    list: { gap: 12 },
    goalRow: { 
        flexDirection: 'row', alignItems: 'center', padding: 18, 
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, 
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 16 
    },
    goalRowActive: { borderColor: GREEN, backgroundColor: GREEN_DIM },
    goalIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    goalTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
    goalTitleActive: { color: GREEN },
    goalDesc: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },

    footer: { 
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, 
        paddingBottom: Platform.OS === 'ios' ? 40 : 24, flexDirection: 'row', 
        alignItems: 'center', gap: 16, backgroundColor: 'transparent'
    },
    btnBack: { 
        width: 56, height: 56, alignItems: 'center', justifyContent: 'center', 
        borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' 
    },
    btnNext: { 
        flex: 1, flexDirection: 'row', height: 56, backgroundColor: GREEN, 
        borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10 
    },
    btnNextText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    loginLink: { marginTop: 24, alignItems: 'center' },
    loginLinkText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
});

