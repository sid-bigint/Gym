import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { useTheme } from '../../src/store/useTheme';
import { useUserStore } from '../../src/store/useUserStore';
import { useNutritionStore } from '../../src/store/useNutritionStore';
import foodDatabase from '../../src/data/foodDatabase.json';
import { getUserCustomFoods, addCustomFood, CustomFood } from '../../src/services/customFoodsService';
import { SavedMeal, addSavedMeal, getSavedMeals } from '../../src/services/savedMealsService';
import { getMealTypeByTime } from '../../src/utils/nutritionUtils';

// New Components
import { SourceSelector } from '../../src/components/nutrition/add/SourceSelector';
import { FoodSearch } from '../../src/components/nutrition/add/FoodSearch';
import { QuantityCard } from '../../src/components/nutrition/add/QuantityCard';
import { FloatingReviewCard } from '../../src/components/nutrition/add/FloatingReviewCard';
import { CustomFoodForm } from '../../src/components/nutrition/add/CustomFoodForm';
import { SavedMealsGrid } from '../../src/components/nutrition/add/SavedMealsGrid';

type AddSource = 'none' | 'search' | 'saved' | 'custom';

export default function AddFoodScreen() {
    const { colors } = useTheme();
    const { user } = useUserStore();
    const { addLog, recentFoods } = useNutritionStore();

    // State
    const [mealType, setMealType] = useState<string>(getMealTypeByTime());
    const [source, setSource] = useState<AddSource>('search'); // Default to search as it's most common
    const [showSourceSelector, setShowSourceSelector] = useState(false);
    const [selectedFood, setSelectedFood] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [addedItems, setAddedItems] = useState<any[]>([]);
    const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
    const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (selectedFood) {
            Animated.spring(overlayAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8
            }).start();
        } else {
            overlayAnim.setValue(0);
        }
    }, [selectedFood]);

    useEffect(() => {
        loadData();
    }, [user?.id]);

    const loadData = async () => {
        if (!user?.id) return;
        const [cf, sm] = await Promise.all([
            getUserCustomFoods(user.id),
            getSavedMeals(user.id)
        ]);
        setCustomFoods(cf);
        setSavedMeals(sm);
    };

    const combinedFoods = useMemo(() => [
        ...(Array.isArray(foodDatabase) ? foodDatabase : foodDatabase.foods).map(f => ({
            id: f.id,
            name: f.name,
            category: f.category,
            isCustom: false,
            per100g: f.per100g,
            servingOptions: (f as any).servingOptions,
        })),
        ...customFoods.map(f => ({
            id: `custom-${f.id}`,
            name: f.name,
            category: 'Custom',
            isCustom: true,
            per100g: {
                calories: f.calories,
                protein: f.protein,
                carbs: f.carbs,
                fats: f.fats,
            }
        }))
    ], [customFoods]);

    const filteredFoods = useMemo(() => {
        if (!searchQuery) {
            // Pick some staples for recommendation
            const staples = [
                'chicken_breast', 'egg_whole', 'egg_white', 'roti_whole_wheat', 'rice_white', 'oats', 
                'paneer_bhurji', 'yogurt_greek', 'banana', 'apple', 'broccoli', 
                'spinach', 'fish_salmon', 'sweet_potato', 'almonds', 'blueberry', 'strawberry',
                'whey_protein_powder', 'peanut_butter', 'milk_whole', 'milk_skim', 'paneer',
                'tofu', 'avocado', 'rice_brown', 'rice_basmati', 'almond_butter', 'coffee_black', 'tea_black'
            ];
            return combinedFoods.filter(f => staples.includes(f.id)).slice(0, 30);
        }
        return combinedFoods.filter(f => 
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.category.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 50);
    }, [combinedFoods, searchQuery]);

    const isAddingRef = useRef(false);

    const handleAddFoodToLog = (quantity: number, unit: 'g' | 'pc') => {
        if (!selectedFood || isAddingRef.current) return;
        isAddingRef.current = true;

        const multiplier = unit === 'g' ? quantity / 100 : quantity;
        let actualMultiplier = multiplier;
        if (unit === 'pc' && selectedFood.servingOptions && selectedFood.servingOptions.length > 0) {
            actualMultiplier = (quantity * selectedFood.servingOptions[0].grams) / 100;
        }

        const newItem = {
            foodName: selectedFood.name,
            calories: Math.round(selectedFood.per100g.calories * actualMultiplier),
            protein: Math.round(selectedFood.per100g.protein * actualMultiplier),
            carbs: Math.round(selectedFood.per100g.carbs * actualMultiplier),
            fats: Math.round(selectedFood.per100g.fats * actualMultiplier),
            quantity,
            unit,
            mealType: mealType.toLowerCase()
        };

        setAddedItems(prev => [...prev, newItem]);
        setSelectedFood(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Reset after animation clears
        setTimeout(() => { isAddingRef.current = false; }, 500);
    };

    const handleSaveCustomFood = async (food: any) => {
        if (!user?.id) return;
        const newId = await addCustomFood({
            userId: user.id as any,
            name: food.name,
            category: 'Custom',
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fats: food.fats,
        });
        await loadData();
        // Auto-select the newly created food
        setSelectedFood({
            id: `custom-${newId}`,
            name: food.name,
            category: 'Custom',
            isCustom: true,
            per100g: {
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
            }
        });
        setSource('search');
    };

    const handleSelectSavedMeal = (meal: SavedMeal) => {
        const items = meal.items.map(item => ({
            foodName: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
            quantity: item.grams,
            unit: 'g',
            mealType: mealType.toLowerCase()
        }));
        setAddedItems([...addedItems, ...items]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleFinish = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            for (const item of addedItems) {
                await addLog(item);
            }
            router.back();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveAsTemplate = () => {
        Alert.prompt(
            "Save Template",
            "Enter a name for this meal template",
            async (name) => {
                if (name && user?.id) {
                    const items = addedItems.map((item, idx) => ({
                        id: `item-${Date.now()}-${idx}`,
                        name: item.foodName,
                        calories: item.calories,
                        protein: item.protein,
                        carbs: item.carbs,
                        fats: item.fats,
                        grams: item.unit === 'g' ? item.quantity : 100
                    }));
                    await addSavedMeal(user.id as any, name, items);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            }
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <Stack.Screen options={{ 
                headerShown: true,
                headerTitle: 'Add Food',
                headerStyle: { backgroundColor: colors.background.primary },
                headerTitleStyle: { color: colors.text.primary, fontWeight: '700' },
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="close" size={28} color={colors.text.primary} />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity onPress={() => setShowSourceSelector(true)} style={styles.headerBtn}>
                        <Ionicons name="options-outline" size={22} color={colors.text.secondary} />
                    </TouchableOpacity>
                )
            }} />

            <View style={[styles.content, { paddingTop: 8 }]}>
                {/* Tab Pills */}
                <View style={[styles.tabBar, { backgroundColor: colors.background.elevated, borderColor: colors.border.primary }]}>
                    {([
                        { key: 'search' as AddSource, label: 'Food Library', icon: 'search' as const },
                        { key: 'saved' as AddSource, label: 'Saved Meals', icon: 'bookmark' as const },
                        { key: 'custom' as AddSource, label: 'Create New', icon: 'add-circle' as const },
                    ]).map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tabPill,
                                source === tab.key && { backgroundColor: colors.accent.primary + '18' },
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSource(tab.key);
                            }}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={16}
                                color={source === tab.key ? colors.accent.primary : colors.text.disabled}
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: source === tab.key ? colors.accent.primary : colors.text.disabled },
                                source === tab.key && { fontWeight: '700' },
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {source === 'search' && (
                    <FoodSearch 
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        recentFoods={recentFoods.slice(0, 4)}
                        searchResults={filteredFoods}
                        onSelectFood={setSelectedFood}
                    />
                )}

                {source === 'custom' && (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                        <CustomFoodForm 
                            onSave={handleSaveCustomFood}
                            onCancel={() => setSource('search')}
                        />
                    </ScrollView>
                )}

                {source === 'saved' && (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                        <SavedMealsGrid 
                            meals={savedMeals}
                            onSelect={handleSelectSavedMeal}
                            onLongPress={() => {}}
                        />
                    </ScrollView>
                )}
            </View>

            {/* Quantity Overlay */}
            {selectedFood && (
                <View style={styles.overlay}>
                    <Animated.View 
                        style={[
                            StyleSheet.absoluteFill,
                            { 
                                opacity: overlayAnim 
                            }
                        ]}
                    >
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                            <TouchableOpacity 
                                style={StyleSheet.absoluteFill} 
                                activeOpacity={1} 
                                onPress={() => setSelectedFood(null)} 
                            />
                        </BlurView>
                    </Animated.View>
                    
                    <Animated.View 
                        style={[
                            styles.overlayContent,
                            {
                                opacity: overlayAnim,
                                transform: [{ scale: overlayAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.9, 1]
                                }) }]
                            }
                        ]}
                    >
                        <QuantityCard 
                            food={selectedFood}
                            onAdd={handleAddFoodToLog}
                            onCancel={() => setSelectedFood(null)}
                        />
                    </Animated.View>
                </View>
            )}

            {/* Source Selector Bottom Sheet (meal type picker) */}
            <Modal visible={showSourceSelector} transparent animationType="slide" onRequestClose={() => setShowSourceSelector(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity 
                        style={{ flex: 1 }} 
                        activeOpacity={1} 
                        onPress={() => setShowSourceSelector(false)}
                    />
                    <SourceSelector 
                        selectedMealType={mealType}
                        onSelectMealType={setMealType}
                        onSelectSource={(s) => {
                            setSource(s);
                            setShowSourceSelector(false);
                        }}
                        onClose={() => setShowSourceSelector(false)}
                    />
                </View>
            </Modal>

            {/* Floating Review Card */}
            <FloatingReviewCard 
                items={addedItems}
                onFinish={handleFinish}
                onSaveTemplate={handleSaveAsTemplate}
                onRemoveItem={(idx) => {
                    const next = [...addedItems];
                    next.splice(idx, 1);
                    setAddedItems(next);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    headerBtn: {
        padding: 8,
    },
    tabBar: {
        flexDirection: 'row',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
    },
    tabPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 10,
        borderRadius: 11,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
    },
    overlayContent: {
        // Center the quantity card
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
});
