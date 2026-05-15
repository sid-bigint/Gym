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
    const [showSourceSelector, setShowSourceSelector] = useState(true);
    const [selectedFood, setSelectedFood] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [addedItems, setAddedItems] = useState<any[]>([]);
    const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
    const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const overlayAnim = useRef(new Animated.Value(0)).current;

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
                'spinach', 'fish_salmon', 'sweet_potato', 'almonds', 'blueberry', 'strawberry'
            ];
            return combinedFoods.filter(f => staples.includes(f.id)).slice(0, 16);
        }
        return combinedFoods.filter(f => 
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.category.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 50);
    }, [combinedFoods, searchQuery]);

    const handleAddFoodToLog = (quantity: number, unit: 'g' | 'pc') => {
        if (!selectedFood) return;

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

        setAddedItems([...addedItems, newItem]);
        setSelectedFood(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        for (const item of addedItems) {
            await addLog(item);
        }
        router.back();
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
                headerTransparent: true,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="close" size={28} color={colors.text.primary} />
                    </TouchableOpacity>
                ),
                headerRight: () => null
            }} />

            <View style={[styles.content, { paddingTop: 100 }]}>
                {/* Step Indicator */}
                <View style={styles.stepIndicator}>
                    {[1, 2].map(s => (
                        <View 
                            key={s} 
                            style={[
                                styles.stepDot, 
                                { backgroundColor: colors.border.primary },
                                s === 1 && source === 'none' && { backgroundColor: colors.accent.primary },
                                s === 2 && source !== 'none' && { backgroundColor: colors.accent.primary }
                            ]} 
                        />
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

            {/* Source Selector Bottom Sheet */}
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
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
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
