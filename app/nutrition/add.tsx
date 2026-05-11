import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../src/components/Button';
import { KeyboardAwareModal } from '../../src/components/KeyboardAwareModal';
import { KeyboardAwareScreen } from '../../src/components/KeyboardAwareScreen';
import { spacing } from '../../src/constants/theme';
import foodDatabase from '../../src/data/foodDatabase.json';
import { getUserCustomFoods, addCustomFood, deleteCustomFood, CustomFood } from '../../src/services/customFoodsService';
import { SavedMeal, addSavedMeal, deleteSavedMeal, getSavedMeals } from '../../src/services/savedMealsService';
import { useAlertStore } from '../../src/store/useAlertStore';
import { useNutritionStore } from '../../src/store/useNutritionStore';
import { useTheme } from '../../src/store/useTheme';
import { useUserStore } from '../../src/store/useUserStore';

type MealFlowStep = 'mealType' | 'addMethod' | 'savedMeals' | 'customFoods' | 'searchFoods' | 'quantity' | 'review';
type MealType = string;

interface FoodItem {
    id: string;
    name: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

interface CombinedFood {
    id: string;
    name: string;
    category: string;
    isCustom: boolean;
    per100g: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    servingOptions?: { label: string; grams: number }[];
}

const DEFAULT_MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const mealIcon = (type: string) => {
    if (type === 'Breakfast') return 'cafe';
    if (type === 'Lunch') return 'restaurant';
    if (type === 'Dinner') return 'moon';
    if (type === 'Snack') return 'fast-food';
    return 'star-outline';
};

export default function AddFoodScreen() {
    const scrollViewRef = useRef<ScrollView>(null);
    const { addLog } = useNutritionStore();
    const { user } = useUserStore();
    const { colors } = useTheme();

    const [step, setStep] = useState<MealFlowStep>('mealType');
    const [mealType, setMealType] = useState<MealType>('Breakfast');
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [selectedFood, setSelectedFood] = useState('');
    const [grams, setGrams] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
    const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
    const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
    const [showSaveMealModal, setShowSaveMealModal] = useState(false);
    const [showMealTypeModal, setShowMealTypeModal] = useState(false);
    const [savedMealName, setSavedMealName] = useState('');
    const [newMealTypeName, setNewMealTypeName] = useState('');
    const [customMealTypes, setCustomMealTypes] = useState<string[]>([]);
    const [loggingUnit, setLoggingUnit] = useState<'grams' | 'count'>('grams');
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ visible: boolean; type: 'mealType' | 'food' | 'savedMeal'; id: string; name: string } | null>(null);

    const [customFoodName, setCustomFoodName] = useState('');
    const [customCalories, setCustomCalories] = useState('');
    const [customProtein, setCustomProtein] = useState('');
    const [customCarbs, setCustomCarbs] = useState('');
    const [customFats, setCustomFats] = useState('');

    useEffect(() => {
        loadCustomFoods();
        loadSavedMeals();
    }, []);

    const loadCustomFoods = async () => {
        if (!user?.id) return;
        setCustomFoods(await getUserCustomFoods(user.id));
    };

    const loadSavedMeals = async () => {
        if (!user?.id) return;
        setSavedMeals(await getSavedMeals(user.id));
    };

    const combinedFoods: CombinedFood[] = useMemo(() => [
        ...foodDatabase.foods.map(f => ({
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
            category: f.category || 'custom',
            isCustom: true,
            per100g: {
                calories: f.calories,
                protein: f.protein,
                carbs: f.carbs,
                fats: f.fats,
            },
        })),
    ], [customFoods]);

    const filteredFoods = useMemo(() => {
        const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (terms.length === 0) return [];
        return combinedFoods.filter(food => {
            const searchable = `${food.name} ${food.category}`.toLowerCase();
            return terms.every(term => searchable.includes(term));
        });
    }, [combinedFoods, searchQuery]);

    const mealTypes = [...DEFAULT_MEAL_TYPES, ...customMealTypes];
    const totals = foodItems.reduce(
        (acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fats: acc.fats + item.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const selectedFoodData = combinedFoods.find(food => food.id === selectedFood);

    const openQuantityForFood = (foodId: string, label?: string) => {
        setSelectedFood(foodId);
        setSearchQuery(label || '');
        setGrams('');
        setLoggingUnit('grams');
        setSelectedSize(null);
        setStep('quantity');
    };

    const goBackStep = () => {
        if (step === 'mealType') {
            router.back();
        } else if (step === 'review') {
            setStep('addMethod');
        } else if (step === 'quantity') {
            setSelectedFood('');
            setGrams('');
            setStep('addMethod');
        } else {
            setStep('mealType');
        }
    };

    const handleAddCustomMealType = () => {
        const name = newMealTypeName.trim();
        if (!name) return;
        if (mealTypes.includes(name)) {
            useAlertStore.getState().showAlert('Error', 'Meal type already exists');
            return;
        }
        setCustomMealTypes(prev => [...prev, name]);
        setMealType(name);
        setNewMealTypeName('');
        setShowMealTypeModal(false);
        setStep('addMethod');
    };

    const handleDeleteCustomMealType = (typeToDelete: string) => {
        setDeleteModal({ visible: true, type: 'mealType', id: typeToDelete, name: typeToDelete });
    };

    const handleDeleteCustomFood = (id: number) => {
        const food = customFoods.find(f => f.id === id);
        setDeleteModal({ visible: true, type: 'food', id: String(id), name: food?.name || 'Food Item' });
    };

    const handleDeleteSavedMeal = (meal: SavedMeal) => {
        setDeleteModal({ visible: true, type: 'savedMeal', id: String(meal.id), name: meal.name });
    };

    const confirmDelete = async () => {
        if (!deleteModal) return;

        if (deleteModal.type === 'mealType') {
            setCustomMealTypes(prev => prev.filter(t => t !== deleteModal.name));
            if (mealType === deleteModal.name) setMealType('Breakfast');
        } else if (deleteModal.type === 'food') {
            await deleteCustomFood(Number(deleteModal.id));
            await loadCustomFoods();
        } else if (deleteModal.type === 'savedMeal' && user?.id) {
            await deleteSavedMeal(Number(deleteModal.id), user.id);
            await loadSavedMeals();
        }
        setDeleteModal(null);
    };

    const handleUseSavedMeal = (meal: SavedMeal) => {
        const stamp = Date.now();
        const clonedItems = meal.items.map((item, index) => ({
            ...item,
            id: `saved-${meal.id}-${stamp}-${index}`,
        }));
        setFoodItems(prev => [...prev, ...clonedItems]);
        setStep('review');
    };

    const handleAddCustomFood = async () => {
        if (!customFoodName.trim() || !customCalories || !customProtein || !customCarbs || !customFats) {
            useAlertStore.getState().showAlert('Required', 'Please fill all fields');
            return;
        }
        if (!user?.id) {
            useAlertStore.getState().showAlert('Error', 'User not found');
            return;
        }

        const createdFoodName = customFoodName.trim();
        const newId = await addCustomFood({
            userId: user.id,
            name: createdFoodName,
            category: 'custom',
            calories: Number(customCalories),
            protein: Number(customProtein),
            carbs: Number(customCarbs),
            fats: Number(customFats),
        });

        setCustomFoodName('');
        setCustomCalories('');
        setCustomProtein('');
        setCustomCarbs('');
        setCustomFats('');
        setShowCustomFoodModal(false);
        await loadCustomFoods();
        openQuantityForFood(`custom-${newId}`, createdFoodName);
    };

    const addFoodItem = () => {
        if (!selectedFoodData || !grams) {
            useAlertStore.getState().showAlert('Required', 'Please enter a value');
            return;
        }

        const val = Number(grams);
        if (!Number.isFinite(val) || val <= 0) {
            useAlertStore.getState().showAlert('Invalid Input', 'Please enter a valid amount');
            return;
        }

        let gramsNum = val;
        if (loggingUnit === 'count') {
            const sizeOption = selectedFoodData.servingOptions?.find(option => option.label === selectedSize);
            if (sizeOption) {
                gramsNum = val * sizeOption.grams;
            } else {
                const nameLower = selectedFoodData.name.toLowerCase();
                let itemWeight = 100;
                if (nameLower.includes('egg')) itemWeight = 50;
                else if (nameLower.includes('roti') || nameLower.includes('chapati')) itemWeight = 35;
                else if (nameLower.includes('bread') || nameLower.includes('slice')) itemWeight = 30;
                else if (nameLower.includes('idli')) itemWeight = 40;
                else if (nameLower.includes('dosa')) itemWeight = 60;
                else if (nameLower.includes('biscuit') || nameLower.includes('cookie')) itemWeight = 10;
                else if (nameLower.includes('fruit') || nameLower.includes('apple') || nameLower.includes('banana')) itemWeight = 120;
                gramsNum = val * itemWeight;
            }
        }

        const multiplier = gramsNum / 100;
        const newItem: FoodItem = {
            id: `${selectedFoodData.id}-${Date.now()}`,
            name: selectedFoodData.name,
            grams: Math.round(gramsNum),
            calories: Math.round(Number(selectedFoodData.per100g.calories) * multiplier),
            protein: Math.round(Number(selectedFoodData.per100g.protein) * multiplier * 10) / 10,
            carbs: Math.round(Number(selectedFoodData.per100g.carbs) * multiplier * 10) / 10,
            fats: Math.round(Number(selectedFoodData.per100g.fats) * multiplier * 10) / 10,
        };

        setFoodItems(prev => [...prev, newItem]);
        setSelectedFood('');
        setGrams('');
        setSearchQuery('');
        setLoggingUnit('grams');
        setSelectedSize(null);
        setStep('review');
    };

    const removeFoodItem = (id: string) => {
        setFoodItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSaveReusableMeal = async () => {
        if (!user?.id) {
            useAlertStore.getState().showAlert('Error', 'User not found');
            return;
        }
        if (foodItems.length === 0) {
            useAlertStore.getState().showAlert('Required', 'Add food items before saving a meal');
            return;
        }
        const name = savedMealName.trim();
        if (!name) {
            useAlertStore.getState().showAlert('Required', 'Please enter a meal name');
            return;
        }

        await addSavedMeal(user.id, name, foodItems);
        setSavedMealName('');
        setShowSaveMealModal(false);
        await loadSavedMeals();
        useAlertStore.getState().showAlert('Saved', `${name} is ready to reuse`);
    };

    const handleSave = async () => {
        if (foodItems.length === 0) {
            useAlertStore.getState().showAlert('Required', 'Please add at least one food item');
            return;
        }

        await addLog({
            foodName: foodItems.map(item => `${item.name} (${item.grams}g)`).join(', '),
            calories: totals.calories,
            protein: totals.protein,
            carbs: totals.carbs,
            fats: totals.fats,
            mealType: mealType as any,
        });
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <Stack.Screen options={{
                title: 'Log Meal',
                headerStyle: { backgroundColor: colors.background.secondary },
                headerTintColor: colors.text.primary,
            }} />

            <KeyboardAwareScreen scrollRef={scrollViewRef} contentContainerStyle={styles.content}>
                <View style={styles.flowHeader}>
                    <TouchableOpacity onPress={goBackStep} style={styles.flowBackButton}>
                        <Ionicons name={step === 'mealType' ? 'close' : 'arrow-back'} size={22} color={colors.text.primary} />
                    </TouchableOpacity>
                    <View style={styles.flowHeaderText}>
                        <Text style={[styles.flowKicker, { color: colors.text.tertiary }]}>LOG MEAL</Text>
                        <Text style={[styles.flowTitle, { color: colors.text.primary }]}>
                            {step === 'mealType' && 'Choose meal type'}
                            {step === 'addMethod' && `Add to ${mealType}`}
                            {step === 'savedMeals' && 'Saved meals'}
                            {step === 'customFoods' && 'Custom foods'}
                            {step === 'searchFoods' && 'Search foods'}
                            {step === 'quantity' && 'Set quantity'}
                            {step === 'review' && 'Review meal'}
                        </Text>
                    </View>
                    {foodItems.length > 0 ? (
                        <TouchableOpacity onPress={() => setStep('review')} style={[styles.countPill, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                            <Text style={[styles.countPillText, { color: colors.accent.primary }]}>{foodItems.length}</Text>
                        </TouchableOpacity>
                    ) : <View style={{ width: 40 }} />}
                </View>

                {step === 'mealType' && (
                    <View>
                        <Text style={[styles.leadText, { color: colors.text.secondary }]}>Start with the meal category. Then choose where the food comes from.</Text>
                        <View style={styles.optionGrid}>
                            {mealTypes.map(type => {
                                const isSelected = mealType === type;
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.optionCard, { backgroundColor: colors.background.card, borderColor: isSelected ? colors.accent.primary : colors.border.secondary }]}
                                        onPress={() => {
                                            setMealType(type);
                                            setStep('addMethod');
                                        }}
                                    >
                                        <Ionicons name={mealIcon(type)} size={22} color={isSelected ? colors.accent.primary : colors.text.tertiary} />
                                        <Text style={[styles.optionTitle, { color: colors.text.primary }]}>{type}</Text>
                                        {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.accent.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity style={styles.secondaryActionRow} onPress={() => setShowMealTypeModal(true)}>
                            <Ionicons name="settings-outline" size={18} color={colors.accent.primary} />
                            <Text style={[styles.secondaryActionText, { color: colors.accent.primary }]}>Manage meal types</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 'addMethod' && (
                    <View>
                        <MealSummary totals={totals} colors={colors} mealType={mealType} itemCount={foodItems.length} />
                        <View style={styles.actionList}>
                            <FlowAction title="Saved meals" subtitle="Reuse a meal you already created" icon="bookmark-outline" colors={colors} onPress={() => setStep('savedMeals')} />
                            <FlowAction title="Custom foods" subtitle="Pick one of your own foods" icon="star-outline" colors={colors} onPress={() => setStep('customFoods')} />
                            <FlowAction title="Search foods" subtitle="Find food from the database" icon="search-outline" colors={colors} onPress={() => setStep('searchFoods')} />
                            <FlowAction title="Create custom food" subtitle="Add a food to your library" icon="add-circle-outline" colors={colors} onPress={() => setShowCustomFoodModal(true)} />
                        </View>
                        {foodItems.length > 0 && <Button title="Review Meal" onPress={() => setStep('review')} style={{ marginTop: spacing.xl }} />}
                    </View>
                )}

                {step === 'savedMeals' && (
                    <View>
                        {savedMeals.length === 0 ? (
                            <EmptyFlowState colors={colors} icon="bookmark-outline" title="No saved meals yet" body="After adding items, save the meal so it appears here next time." />
                        ) : savedMeals.map(meal => (
                            <TouchableOpacity key={meal.id} style={[styles.listRow, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]} onPress={() => handleUseSavedMeal(meal)}>
                                <View style={styles.listRowMain}>
                                    <Text style={[styles.listRowTitle, { color: colors.text.primary }]}>{meal.name}</Text>
                                    <Text style={[styles.listRowMeta, { color: colors.text.tertiary }]}>{meal.items.length} items - {meal.calories} kcal</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteSavedMeal(meal)} style={styles.rowIconButton}>
                                    <Ionicons name="trash-outline" size={18} color={colors.text.tertiary} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {step === 'customFoods' && (
                    <View>
                        <TouchableOpacity style={[styles.createRow, { borderColor: colors.border.secondary }]} onPress={() => setShowCustomFoodModal(true)}>
                            <Ionicons name="add" size={18} color={colors.accent.primary} />
                            <Text style={[styles.secondaryActionText, { color: colors.accent.primary }]}>Create custom food</Text>
                        </TouchableOpacity>
                        {customFoods.length === 0 ? (
                            <EmptyFlowState colors={colors} icon="star-outline" title="No custom foods yet" body="Create your frequent foods once, then log them quickly here." />
                        ) : customFoods.map(food => (
                            <TouchableOpacity key={food.id} style={[styles.listRow, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]} onPress={() => food.id && openQuantityForFood(`custom-${food.id}`, food.name)}>
                                <View style={styles.listRowMain}>
                                    <Text style={[styles.listRowTitle, { color: colors.text.primary }]}>{food.name}</Text>
                                    <Text style={[styles.listRowMeta, { color: colors.text.tertiary }]}>{food.calories} kcal per 100g - P:{food.protein} C:{food.carbs} F:{food.fats}</Text>
                                </View>
                                <TouchableOpacity onPress={() => food.id && handleDeleteCustomFood(food.id)} style={styles.rowIconButton}>
                                    <Ionicons name="trash-outline" size={18} color={colors.text.tertiary} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {step === 'searchFoods' && (
                    <View>
                        <View style={[styles.searchBar, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                            <Ionicons name="search" size={18} color={colors.text.tertiary} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text.primary }]}
                                placeholder="Search food or ingredient"
                                placeholderTextColor={colors.text.disabled}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {searchQuery.trim().length === 0 ? (
                            <EmptyFlowState colors={colors} icon="search-outline" title="Search foods" body="Type a food name to add it to this meal." />
                        ) : filteredFoods.length === 0 ? (
                            <View>
                                <EmptyFlowState colors={colors} icon="search-outline" title="No foods found" body="Create it as a custom food and use it right away." />
                                <Button title={`Create "${searchQuery}"`} onPress={() => {
                                    setCustomFoodName(searchQuery);
                                    setShowCustomFoodModal(true);
                                }} />
                            </View>
                        ) : filteredFoods.slice(0, 25).map(food => (
                            <TouchableOpacity key={food.id} style={[styles.listRow, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]} onPress={() => openQuantityForFood(food.id, food.name)}>
                                <View style={styles.listRowMain}>
                                    <Text style={[styles.listRowTitle, { color: colors.text.primary }]}>{food.name}</Text>
                                    <Text style={[styles.listRowMeta, { color: colors.text.tertiary }]}>{food.per100g.calories} kcal per 100g - P:{food.per100g.protein}g{food.isCustom ? ' - Custom' : ''}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {step === 'quantity' && selectedFoodData && (
                    <View>
                        <View style={[styles.quantityCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                            <Text style={[styles.quantityFoodName, { color: colors.text.primary }]}>{selectedFoodData.name}</Text>
                            <Text style={[styles.listRowMeta, { color: colors.text.tertiary }]}>{selectedFoodData.per100g.calories} kcal per 100g</Text>

                            <View style={styles.unitSelector}>
                                <TouchableOpacity onPress={() => setLoggingUnit('grams')} style={[styles.unitTab, loggingUnit === 'grams' && { borderColor: colors.accent.primary, backgroundColor: colors.background.elevated }]}>
                                    <Text style={[styles.unitTabText, { color: loggingUnit === 'grams' ? colors.accent.primary : colors.text.tertiary }]}>Grams</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setLoggingUnit('count')} style={[styles.unitTab, loggingUnit === 'count' && { borderColor: colors.accent.primary, backgroundColor: colors.background.elevated }]}>
                                    <Text style={[styles.unitTabText, { color: loggingUnit === 'count' ? colors.accent.primary : colors.text.tertiary }]}>Quantity</Text>
                                </TouchableOpacity>
                            </View>

                            {loggingUnit === 'count' && selectedFoodData.servingOptions ? (
                                <View style={styles.sizeGrid}>
                                    {selectedFoodData.servingOptions.map(opt => (
                                        <TouchableOpacity key={opt.label} onPress={() => setSelectedSize(opt.label)} style={[styles.sizeBtn, { borderColor: selectedSize === opt.label ? colors.accent.primary : colors.border.secondary }]}>
                                            <Text style={[styles.sizeBtnText, { color: selectedSize === opt.label ? colors.accent.primary : colors.text.primary }]}>{opt.label}</Text>
                                            <Text style={[styles.sizeBtnSubtext, { color: colors.text.tertiary }]}>{opt.grams}g</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : null}

                            <View style={[styles.quantityInputRow, { borderColor: colors.border.secondary }]}>
                                <TextInput
                                    style={[styles.quantityInput, { color: colors.text.primary }]}
                                    placeholder="0"
                                    placeholderTextColor={colors.text.disabled}
                                    keyboardType="numeric"
                                    value={grams}
                                    onChangeText={setGrams}
                                    autoFocus
                                />
                                <Text style={[styles.unitLabel, { color: colors.text.tertiary }]}>{loggingUnit === 'grams' ? 'grams' : 'servings'}</Text>
                            </View>
                        </View>
                        <Button title="Add to Meal" onPress={addFoodItem} style={{ marginTop: spacing.xl }} />
                    </View>
                )}

                {step === 'review' && (
                    <View>
                        <MealSummary totals={totals} colors={colors} mealType={mealType} itemCount={foodItems.length} />
                        <View style={styles.reviewActions}>
                            <TouchableOpacity style={[styles.compactAction, { borderColor: colors.border.secondary }]} onPress={() => setStep('addMethod')}>
                                <Ionicons name="add" size={18} color={colors.accent.primary} />
                                <Text style={[styles.secondaryActionText, { color: colors.accent.primary }]}>Add More</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.compactAction, { borderColor: colors.border.secondary, opacity: foodItems.length === 0 ? 0.45 : 1 }]}
                                disabled={foodItems.length === 0}
                                onPress={() => {
                                    setSavedMealName(`${mealType} meal`);
                                    setShowSaveMealModal(true);
                                }}
                            >
                                <Ionicons name="bookmark-outline" size={18} color={colors.accent.primary} />
                                <Text style={[styles.secondaryActionText, { color: colors.accent.primary }]}>Save Meal</Text>
                            </TouchableOpacity>
                        </View>

                        {foodItems.length === 0 ? (
                            <EmptyFlowState colors={colors} icon="restaurant-outline" title="No items yet" body="Add food before saving this meal log." />
                        ) : foodItems.map(item => (
                            <View key={item.id} style={[styles.listRow, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                                <View style={styles.listRowMain}>
                                    <Text style={[styles.listRowTitle, { color: colors.text.primary }]}>{item.name}</Text>
                                    <Text style={[styles.listRowMeta, { color: colors.text.tertiary }]}>{item.grams}g - {item.calories} kcal - P:{item.protein}g</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeFoodItem(item.id)} style={styles.rowIconButton}>
                                    <Ionicons name="remove-circle-outline" size={20} color={colors.status.error} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <Button title={`Log ${mealType}`} onPress={handleSave} style={{ marginTop: spacing.xl }} disabled={foodItems.length === 0} />
                    </View>
                )}
            </KeyboardAwareScreen>

            <SaveMealModal
                visible={showSaveMealModal}
                colors={colors}
                foodItems={foodItems}
                savedMealName={savedMealName}
                setSavedMealName={setSavedMealName}
                onClose={() => setShowSaveMealModal(false)}
                onSave={handleSaveReusableMeal}
            />

            <CustomFoodModal
                visible={showCustomFoodModal}
                colors={colors}
                customFoods={customFoods}
                customFoodName={customFoodName}
                customCalories={customCalories}
                customProtein={customProtein}
                customCarbs={customCarbs}
                customFats={customFats}
                setCustomFoodName={setCustomFoodName}
                setCustomCalories={setCustomCalories}
                setCustomProtein={setCustomProtein}
                setCustomCarbs={setCustomCarbs}
                setCustomFats={setCustomFats}
                onDeleteFood={handleDeleteCustomFood}
                onClose={() => setShowCustomFoodModal(false)}
                onSave={handleAddCustomFood}
            />

            <MealTypeModal
                visible={showMealTypeModal}
                colors={colors}
                customMealTypes={customMealTypes}
                newMealTypeName={newMealTypeName}
                setNewMealTypeName={setNewMealTypeName}
                onDeleteType={handleDeleteCustomMealType}
                onClose={() => setShowMealTypeModal(false)}
                onSave={handleAddCustomMealType}
            />

            <DeleteModal
                deleteModal={deleteModal}
                colors={colors}
                onClose={() => setDeleteModal(null)}
                onConfirm={confirmDelete}
            />
        </View>
    );
}

function FlowAction({ title, subtitle, icon, colors, onPress }: any) {
    return (
        <TouchableOpacity style={[styles.flowAction, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]} onPress={onPress}>
            <View style={[styles.flowActionIcon, { backgroundColor: colors.background.elevated }]}>
                <Ionicons name={icon} size={20} color={colors.accent.primary} />
            </View>
            <View style={styles.listRowMain}>
                <Text style={[styles.listRowTitle, { color: colors.text.primary }]}>{title}</Text>
                <Text style={[styles.listRowMeta, { color: colors.text.tertiary }]}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </TouchableOpacity>
    );
}

function MealSummary({ totals, colors, mealType, itemCount }: any) {
    return (
        <View style={[styles.summaryCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
            <View>
                <Text style={[styles.summaryLabel, { color: colors.text.tertiary }]}>{mealType} total</Text>
                <Text style={[styles.summaryCalories, { color: colors.text.primary }]}>{totals.calories} kcal</Text>
            </View>
            <Text style={[styles.summaryItems, { color: colors.text.tertiary }]}>{itemCount} items</Text>
            <View style={styles.summaryMacros}>
                <Text style={[styles.summaryMacroText, { color: colors.text.secondary }]}>P {totals.protein.toFixed(1)}g</Text>
                <Text style={[styles.summaryMacroText, { color: colors.text.secondary }]}>C {totals.carbs.toFixed(1)}g</Text>
                <Text style={[styles.summaryMacroText, { color: colors.text.secondary }]}>F {totals.fats.toFixed(1)}g</Text>
            </View>
        </View>
    );
}

function EmptyFlowState({ colors, icon, title, body }: any) {
    return (
        <View style={styles.emptyState}>
            <Ionicons name={icon} size={36} color={colors.text.disabled} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{title}</Text>
            <Text style={[styles.emptyBody, { color: colors.text.tertiary }]}>{body}</Text>
        </View>
    );
}

function SaveMealModal({ visible, colors, foodItems, savedMealName, setSavedMealName, onClose, onSave }: any) {
    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <KeyboardAwareModal overlayStyle={styles.deleteOverlay} contentStyle={[styles.confirmModal, { backgroundColor: colors.background.elevated }]}>
                <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>Save Reusable Meal</Text>
                <Text style={[styles.confirmText, { color: colors.text.secondary }]}>Save these {foodItems.length} item(s) so you can add them again later.</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary, width: '100%' }]}
                    placeholder="e.g., Morning oats"
                    placeholderTextColor={colors.text.disabled}
                    value={savedMealName}
                    onChangeText={setSavedMealName}
                    autoFocus
                />
                <View style={[styles.confirmButtons, { marginTop: spacing.lg }]}>
                    <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.background.card }]} onPress={onClose}>
                        <Text style={[styles.confirmButtonText, { color: colors.text.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.accent.primary }]} onPress={onSave}>
                        <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>Save Meal</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareModal>
        </Modal>
    );
}

function CustomFoodModal(props: any) {
    const { visible, colors, customFoods, customFoodName, customCalories, customProtein, customCarbs, customFats, setCustomFoodName, setCustomCalories, setCustomProtein, setCustomCarbs, setCustomFats, onDeleteFood, onClose, onSave } = props;
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAwareModal overlayStyle={styles.modalOverlay} contentStyle={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Custom Food</Text>
                    <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.text.primary} /></TouchableOpacity>
                </View>
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Text style={[styles.label, { color: colors.text.secondary, marginTop: 0 }]}>Created foods</Text>
                    {customFoods.length === 0 ? (
                        <Text style={{ color: colors.text.tertiary, paddingVertical: spacing.sm }}>No custom foods added.</Text>
                    ) : customFoods.map((food: CustomFood) => (
                        <View key={food.id} style={[styles.modalListRow, { borderBottomColor: colors.border.secondary }]}>
                            <View style={styles.listRowMain}>
                                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{food.name}</Text>
                                <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>{food.calories} kcal - P:{food.protein} C:{food.carbs} F:{food.fats}</Text>
                            </View>
                            <TouchableOpacity onPress={() => food.id && onDeleteFood(food.id)} style={styles.rowIconButton}>
                                <Ionicons name="trash-outline" size={20} color={colors.status.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <View style={[styles.modalDivider, { backgroundColor: colors.border.secondary }]} />
                    <Text style={[styles.label, { color: colors.text.secondary }]}>Food Name</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]} placeholder="e.g., My Protein Shake" placeholderTextColor={colors.text.disabled} value={customFoodName} onChangeText={setCustomFoodName} />
                    <Text style={[styles.helpText, { color: colors.text.tertiary }]}>Nutrition per 100g</Text>
                    <View style={styles.row}>
                        <InputField label="Calories" value={customCalories} onChangeText={setCustomCalories} colors={colors} />
                        <InputField label="Protein" value={customProtein} onChangeText={setCustomProtein} colors={colors} />
                    </View>
                    <View style={styles.row}>
                        <InputField label="Carbs" value={customCarbs} onChangeText={setCustomCarbs} colors={colors} />
                        <InputField label="Fats" value={customFats} onChangeText={setCustomFats} colors={colors} />
                    </View>
                    <Button title="Save Food" onPress={onSave} style={{ marginTop: spacing.lg }} />
                </ScrollView>
            </KeyboardAwareModal>
        </Modal>
    );
}

function InputField({ label, value, onChangeText, colors }: any) {
    return (
        <View style={styles.halfCol}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]} placeholder="0" placeholderTextColor={colors.text.disabled} keyboardType="numeric" value={value} onChangeText={onChangeText} />
        </View>
    );
}

function MealTypeModal({ visible, colors, customMealTypes, newMealTypeName, setNewMealTypeName, onDeleteType, onClose, onSave }: any) {
    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <KeyboardAwareModal overlayStyle={styles.modalOverlay} contentStyle={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Meal Types</Text>
                    <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.text.primary} /></TouchableOpacity>
                </View>
                <Text style={[styles.label, { color: colors.text.secondary, marginTop: 0 }]}>Custom types</Text>
                {customMealTypes.length === 0 ? (
                    <Text style={{ color: colors.text.tertiary, paddingVertical: spacing.sm }}>No custom types added yet.</Text>
                ) : customMealTypes.map((type: string) => (
                    <View key={type} style={[styles.modalListRow, { borderBottomColor: colors.border.secondary }]}>
                        <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{type}</Text>
                        <TouchableOpacity onPress={() => onDeleteType(type)} style={styles.rowIconButton}>
                            <Ionicons name="trash-outline" size={20} color={colors.status.error} />
                        </TouchableOpacity>
                    </View>
                ))}
                <Text style={[styles.label, { color: colors.text.secondary }]}>Add type</Text>
                <TextInput style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]} placeholder="e.g., Pre-workout" placeholderTextColor={colors.text.disabled} value={newMealTypeName} onChangeText={setNewMealTypeName} />
                <Button title="Add Type" onPress={onSave} style={{ marginTop: spacing.lg }} />
            </KeyboardAwareModal>
        </Modal>
    );
}

function DeleteModal({ deleteModal, colors, onClose, onConfirm }: any) {
    return (
        <Modal visible={!!deleteModal?.visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.deleteOverlay}>
                <View style={[styles.confirmModal, { backgroundColor: colors.background.elevated }]}>
                    <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>Delete {deleteModal?.type === 'mealType' ? 'Meal Type' : deleteModal?.type === 'savedMeal' ? 'Saved Meal' : 'Food'}</Text>
                    <Text style={[styles.confirmText, { color: colors.text.secondary }]}>{`Are you sure you want to delete "${deleteModal?.name}"?`}</Text>
                    <View style={styles.confirmButtons}>
                        <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.background.card }]} onPress={onClose}>
                            <Text style={[styles.confirmButtonText, { color: colors.text.primary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.status.error }]} onPress={onConfirm}>
                            <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        padding: spacing.xl,
        paddingBottom: 110,
    },
    flowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    flowBackButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    flowHeaderText: { flex: 1 },
    flowKicker: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    flowTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 2,
    },
    countPill: {
        minWidth: 40,
        height: 34,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countPillText: { fontSize: 14, fontWeight: '900' },
    leadText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    optionGrid: {
        gap: spacing.md,
    },
    optionCard: {
        minHeight: 66,
        borderRadius: 12,
        borderWidth: 1,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    optionTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
    },
    secondaryActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
    },
    secondaryActionText: {
        fontSize: 14,
        fontWeight: '800',
    },
    actionList: { gap: spacing.sm },
    flowAction: {
        minHeight: 72,
        borderRadius: 12,
        borderWidth: 1,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    flowActionIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    summaryCalories: {
        fontSize: 28,
        fontWeight: '900',
        marginTop: 2,
    },
    summaryItems: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        fontSize: 12,
        fontWeight: '800',
    },
    summaryMacros: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    summaryMacroText: {
        fontSize: 13,
        fontWeight: '700',
    },
    listRow: {
        borderRadius: 12,
        borderWidth: 1,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    listRowMain: {
        flex: 1,
        minWidth: 0,
    },
    listRowTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    listRowMeta: {
        fontSize: 12,
        marginTop: 3,
        lineHeight: 17,
    },
    rowIconButton: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createRow: {
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        padding: spacing.md,
        marginBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    searchBar: {
        minHeight: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: 48,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxxl,
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '900',
        marginTop: spacing.md,
    },
    emptyBody: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: spacing.sm,
    },
    quantityCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: spacing.lg,
    },
    quantityFoodName: {
        fontSize: 20,
        fontWeight: '900',
    },
    unitSelector: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
    },
    unitTab: {
        flex: 1,
        minHeight: 40,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unitTabText: {
        fontSize: 13,
        fontWeight: '800',
    },
    sizeGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    sizeBtn: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        padding: spacing.sm,
        alignItems: 'center',
    },
    sizeBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
    sizeBtnSubtext: {
        fontSize: 11,
        marginTop: 2,
    },
    quantityInputRow: {
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 54,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityInput: {
        flex: 1,
        fontSize: 22,
        fontWeight: '900',
        height: 54,
    },
    unitLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    reviewActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    compactAction: {
        flex: 1,
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.xl,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
    },
    modalListRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    modalDivider: {
        height: 1,
        marginVertical: spacing.lg,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    input: {
        height: 52,
        paddingHorizontal: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    halfCol: { flex: 1 },
    helpText: {
        fontSize: 12,
        marginTop: spacing.md,
        fontStyle: 'italic',
    },
    deleteOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    confirmModal: {
        width: '100%',
        padding: spacing.xl,
        borderRadius: 18,
        alignItems: 'center',
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: spacing.sm,
    },
    confirmText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: spacing.xl,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '800',
    },
});
