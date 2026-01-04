import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';

import { Stack, router } from 'expo-router';
import { Button } from '../../src/components/Button';
import { useNutritionStore } from '../../src/store/useNutritionStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useTheme } from '../../src/store/useTheme';
import { useAlert } from '../../src/context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../../src/constants/theme';
import foodDatabase from '../../src/data/foodDatabase.json';
import { getUserCustomFoods, addCustomFood, deleteCustomFood, CustomFood } from '../../src/services/customFoodsService';
import { LinearGradient } from 'expo-linear-gradient';



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

export default function AddFoodScreen() {
    const scrollViewRef = useRef<ScrollView>(null);
    const { addLog } = useNutritionStore();
    const { user } = useUserStore();
    const { colors } = useTheme();
    const { showAlert } = useAlert();

    const [mealType, setMealType] = useState<MealType>('Breakfast');
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [selectedFood, setSelectedFood] = useState('');
    const [grams, setGrams] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
    const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);

    // Custom Meal Type State
    const [showMealTypeModal, setShowMealTypeModal] = useState(false);
    const [newMealTypeName, setNewMealTypeName] = useState('');
    const [customMealTypes, setCustomMealTypes] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loggingUnit, setLoggingUnit] = useState<'grams' | 'count'>('grams');
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ visible: boolean; type: 'mealType' | 'food'; id: string; name: string } | null>(null);
    const [isSearchActive, setIsSearchActive] = useState(false);

    const confirmDelete = async () => {
        if (!deleteModal) return;

        if (deleteModal.type === 'mealType') {
            setCustomMealTypes(prev => prev.filter(t => t !== deleteModal.name));
            if (mealType === deleteModal.name) {
                setMealType('Breakfast');
            }
        } else if (deleteModal.type === 'food') {
            await deleteCustomFood(Number(deleteModal.id));
            await loadCustomFoods();
        }
        setDeleteModal(null);
    };

    // Custom food form state
    const [customFoodName, setCustomFoodName] = useState('');
    const [customCalories, setCustomCalories] = useState('');
    const [customProtein, setCustomProtein] = useState('');
    const [customCarbs, setCustomCarbs] = useState('');
    const [customFats, setCustomFats] = useState('');

    useEffect(() => {
        loadCustomFoods();
    }, []);

    const loadCustomFoods = async () => {
        if (user?.id) {
            const foods = await getUserCustomFoods(user.id);
            setCustomFoods(foods);
        }
    };

    const handleAddCustomMealType = () => {
        if (newMealTypeName.trim()) {
            const name = newMealTypeName.trim();
            // Prevent duplicates
            if (customMealTypes.includes(name) || ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(name)) {
                showAlert('Error', 'Meal type already exists');
                return;
            }
            setCustomMealTypes([...customMealTypes, name]);
            setMealType(name);
            setNewMealTypeName('');
        }
    };

    const handleDeleteCustomMealType = (typeToDelete: string) => {
        setDeleteModal({
            visible: true,
            type: 'mealType',
            id: typeToDelete,
            name: typeToDelete
        });
    };

    // ... (rest of filtering logic) ...

    // ... (rest of methods) ...
    // Note: I am NOT replacing methods filter/handleAddCustomFood yet, just the top part.
    // Wait, replace_file_content needs contiguous block. I'll stick to the top part.

    const combinedFoods: CombinedFood[] = [
        ...foodDatabase.foods.map(f => ({
            id: f.id,
            name: f.name,
            category: f.category,
            isCustom: false,
            per100g: f.per100g
        })),
        ...customFoods.map(f => ({
            id: `custom-${f.id}`,
            name: `${f.name} ⭐`,
            category: f.category || 'custom',
            isCustom: true,
            per100g: {
                calories: f.calories,
                protein: f.protein,
                carbs: f.carbs,
                fats: f.fats
            }
        }))
    ];

    const filteredFoods = combinedFoods.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ... methods ...

    // I will target the Rendering Part for the Meal Type Grid in the next step. 
    // This step handles imports/type/state.



    const handleDeleteCustomFood = (id: number) => {
        const food = customFoods.find(f => f.id === id);
        setDeleteModal({
            visible: true,
            type: 'food',
            id: String(id),
            name: food?.name || 'Food Item'
        });
    };

    const handleAddCustomFood = async () => {
        if (!customFoodName || !customCalories || !customProtein || !customCarbs || !customFats) {
            showAlert('Required', 'Please fill all fields');
            return;
        }

        if (!user?.id) {
            showAlert('Error', 'User not found');
            return;
        }

        await addCustomFood({
            userId: user.id,
            name: customFoodName,
            category: 'custom',
            calories: Number(customCalories),
            protein: Number(customProtein),
            carbs: Number(customCarbs),
            fats: Number(customFats)
        });

        // Reset form
        setCustomFoodName('');
        setCustomCalories('');
        setCustomProtein('');
        setCustomCarbs('');
        setCustomFats('');
        setShowCustomFoodModal(false);

        // Reload custom foods
        await loadCustomFoods();
        showAlert('Success', 'Custom food added!');
    };

    const addFoodItem = () => {
        const food = [...foodDatabase.foods, ...customFoods].find(f => f.id === selectedFood || `custom-${f.id}` === selectedFood);
        if (!food || !grams) {
            showAlert('Required', 'Please enter a value');
            return;
        }

        const val = Number(grams);
        let gramsNum = val;

        if (loggingUnit === 'count') {
            const sizeOption = (food as any).servingOptions?.find((o: any) => o.label === selectedSize);

            if (sizeOption) {
                gramsNum = val * sizeOption.grams;
            } else {
                // Heuristics for items without DB serving options
                let itemWeight = 100;
                const nameLower = food.name.toLowerCase();

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

        // Handle both database food and custom food structures
        const macros = 'per100g' in food ? food.per100g : food;

        const newItem: FoodItem = {
            id: `${food.id}-${Date.now()}`,
            name: food.name,
            grams: Math.round(gramsNum),
            calories: Math.round(Number(macros.calories) * multiplier),
            protein: Math.round(Number(macros.protein) * multiplier * 10) / 10,
            carbs: Math.round(Number(macros.carbs) * multiplier * 10) / 10,
            fats: Math.round(Number(macros.fats) * multiplier * 10) / 10,
        };

        setFoodItems([...foodItems, newItem]);
        setSelectedFood('');
        setGrams('');
        setSearchQuery('');
        setLoggingUnit('grams');
        setSelectedSize(null);
    };

    const removeFoodItem = (id: string) => {
        setFoodItems(foodItems.filter(item => item.id !== id));
    };

    const calculateTotals = () => {
        return foodItems.reduce(
            (acc, item) => ({
                calories: acc.calories + item.calories,
                protein: acc.protein + item.protein,
                carbs: acc.carbs + item.carbs,
                fats: acc.fats + item.fats,
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );
    };

    const handleSave = async () => {
        if (foodItems.length === 0) {
            showAlert('Required', 'Please add at least one food item');
            return;
        }

        const totals = calculateTotals();
        const foodNames = foodItems.map(item => `${item.name} (${item.grams}g)`).join(', ');

        await addLog({
            foodName: foodNames,
            calories: totals.calories,
            protein: totals.protein,
            carbs: totals.carbs,
            fats: totals.fats,
            mealType: mealType as any
        });
        router.back();
    };

    const totals = calculateTotals();

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <Stack.Screen options={{
                title: 'Log Meal',
                headerStyle: { backgroundColor: colors.background.secondary },
                headerTintColor: colors.text.primary
            }} />

            <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.content, isSearchActive && styles.searchContentActive]} keyboardShouldPersistTaps="handled">
                {/* Food Search Section - Now at the Top */}
                <View style={[styles.searchSection, isSearchActive && styles.searchSectionActive]}>
                    <View style={styles.searchHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                setIsSearchActive(false);
                                setSearchQuery('');
                                setSelectedFood('');
                            }}
                            style={styles.backButtonIcon}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.searchTitleLarge, { color: colors.text.primary }]}>
                            {isSearchActive ? 'Find Food' : 'Search'}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={[
                        styles.searchBarContainer,
                        {
                            backgroundColor: isSearchActive ? 'rgba(139, 92, 246, 0.04)' : colors.background.card,
                            borderColor: isSearchActive ? colors.accent.primary : colors.border.secondary,
                            shadowColor: colors.accent.primary,
                            shadowOpacity: isSearchActive ? 0.08 : 0,
                            shadowRadius: 15,
                        }
                    ]}>
                        <Ionicons name="search" size={20} color={isSearchActive ? colors.accent.primary : colors.text.tertiary} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInputInline, { color: colors.text.primary }]}
                            placeholder="Find food or ingredients..."
                            placeholderTextColor={colors.text.disabled}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => setIsSearchActive(true)}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {isSearchActive && searchQuery.length > 0 && !selectedFood && (
                        <View style={[styles.searchResultsWrapper, { backgroundColor: colors.background.elevated, borderColor: colors.border.secondary, minHeight: 400 }]}>
                            <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                                {filteredFoods.length > 0 ? filteredFoods.slice(0, 15).map(food => (
                                    <TouchableOpacity
                                        key={food.id}
                                        style={[styles.dropdownItem, { borderBottomColor: colors.border.secondary }]}
                                        onPress={() => {
                                            setSelectedFood(food.id);
                                            // Keep search query as is or use it as label
                                        }}
                                    >
                                        <View style={styles.dropdownContent}>
                                            <Text style={[styles.dropdownText, { color: colors.text.primary }]}>{food.name}</Text>
                                            <Text style={[styles.dropdownSubtext, { color: colors.text.tertiary }]}>
                                                {food.per100g.calories} kcal • P: {food.per100g.protein}g {food.isCustom && '• ⭐ Custom'}
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name="add-circle-outline"
                                            size={24}
                                            color={colors.accent.primary}
                                        />
                                    </TouchableOpacity>
                                )) : (
                                    <View style={styles.emptyResults}>
                                        <Ionicons name="search-outline" size={48} color={colors.text.disabled} />
                                        <Text style={{ color: colors.text.tertiary, marginTop: 12, marginBottom: 16 }}>No foods found</Text>
                                        <TouchableOpacity
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                                paddingHorizontal: 16,
                                                paddingVertical: 10,
                                                borderRadius: 12,
                                                gap: 8
                                            }}
                                            onPress={() => {
                                                setCustomFoodName(searchQuery); // Pre-fill name
                                                setShowCustomFoodModal(true);
                                            }}
                                        >
                                            <Ionicons name="add-circle" size={20} color={colors.accent.primary} />
                                            <Text style={{ color: colors.accent.primary, fontWeight: '700' }}>Create Custom Food</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}

                    {selectedFood && (
                        <View style={styles.selectionFocusContainer}>
                            {/* Focused Selection Card */}
                            <View style={[styles.focusedFoodCard, { backgroundColor: colors.background.elevated, borderColor: colors.accent.primary }]}>
                                <View style={styles.focusedFoodHeader}>
                                    <View style={styles.focusedFoodInfo}>
                                        <Text style={[styles.focusedFoodName, { color: colors.text.primary }]}>
                                            {(() => {
                                                const food = [...foodDatabase.foods, ...customFoods].find(f => f.id === selectedFood || `custom-${f.id}` === selectedFood);
                                                return food?.name || 'Selected Food';
                                            })()}
                                        </Text>
                                        <Text style={[styles.focusedFoodMeta, { color: colors.text.tertiary }]}>
                                            {(() => {
                                                const food = [...foodDatabase.foods, ...customFoods].find(f => f.id === selectedFood || `custom-${f.id}` === selectedFood);
                                                if (food && 'per100g' in food) {
                                                    return `${food.per100g.calories} kcal per 100g`;
                                                } else if (food) {
                                                    //@ts-ignore - CustomFood has direct macro properties
                                                    return `${food.calories} kcal per 100g`;
                                                }
                                                return '';
                                            })()}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedFood('');
                                            setGrams('');
                                        }}
                                        style={styles.changeFoodBtn}
                                    >
                                        <Ionicons name="close-circle" size={24} color={colors.text.tertiary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.unitSelector}>
                                    <TouchableOpacity
                                        onPress={() => setLoggingUnit('grams')}
                                        style={[styles.unitTab, loggingUnit === 'grams' && { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: colors.accent.primary }]}
                                    >
                                        <Text style={[styles.unitTabText, { color: loggingUnit === 'grams' ? colors.accent.primary : colors.text.tertiary }]}>Grams</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setLoggingUnit('count')}
                                        style={[styles.unitTab, loggingUnit === 'count' && { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: colors.accent.primary }]}
                                    >
                                        <Text style={[styles.unitTabText, { color: loggingUnit === 'count' ? colors.accent.primary : colors.text.tertiary }]}>Quantity</Text>
                                    </TouchableOpacity>
                                </View>

                                {loggingUnit === 'count' && (() => {
                                    const food = [...foodDatabase.foods, ...customFoods].find(f => f.id === selectedFood || `custom-${f.id}` === selectedFood);
                                    const options = (food as any)?.servingOptions;
                                    if (!options) return null;

                                    return (
                                        <View style={styles.sizeOptionsWrapper}>
                                            <Text style={[styles.sizeLabel, { color: colors.text.tertiary }]}>Select Size</Text>
                                            <View style={styles.sizeGrid}>
                                                {options.map((opt: any) => (
                                                    <TouchableOpacity
                                                        key={opt.label}
                                                        onPress={() => setSelectedSize(opt.label)}
                                                        style={[
                                                            styles.sizeBtn,
                                                            { borderColor: colors.border.secondary },
                                                            selectedSize === opt.label && { borderColor: colors.accent.primary, backgroundColor: 'rgba(139, 92, 246, 0.05)' }
                                                        ]}
                                                    >
                                                        <Text style={[styles.sizeBtnText, { color: selectedSize === opt.label ? colors.accent.primary : colors.text.primary }]}>{opt.label}</Text>
                                                        <Text style={[styles.sizeBtnSubtext, { color: colors.text.tertiary }]}>{opt.grams}g</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })()}

                                <View style={styles.gramsActionRowFocused}>
                                    <View style={[styles.gramsInputWrapperFocused, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                                        <TextInput
                                            style={[styles.gramsInputInline, { color: colors.text.primary }]}
                                            placeholder="0"
                                            placeholderTextColor={colors.text.disabled}
                                            keyboardType="numeric"
                                            value={grams}
                                            onChangeText={setGrams}
                                            autoFocus
                                        />
                                        <Text style={[styles.unitLabel, { color: colors.text.tertiary }]}>
                                            {loggingUnit === 'grams' ? 'grams' : 'pcs/serv'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.addBtnLarge, { backgroundColor: colors.accent.primary }]}
                                        onPress={() => {
                                            addFoodItem();
                                            // Stay in search mode
                                        }}
                                    >
                                        <Ionicons name="checkmark" size={28} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Quick Session Log - Visible during active search */}
                    {isSearchActive && foodItems.length > 0 && !selectedFood && (
                        <View style={styles.sessionLogSection}>
                            <View style={styles.sessionLogHeader}>
                                <Text style={[styles.sectionTitleMini, { color: colors.text.tertiary }]}>ADDED THIS SESSION</Text>
                                <View style={[styles.sessionBadge, { backgroundColor: colors.accent.primary }]}>
                                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>{foodItems.length}</Text>
                                </View>
                            </View>
                            <View style={styles.sessionList}>
                                {foodItems.slice(-4).reverse().map(item => (
                                    <View key={item.id} style={[styles.sessionFoodCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                                        <View style={styles.sessionFoodInfo}>
                                            <Text style={[styles.sessionFoodName, { color: colors.text.primary }]} numberOfLines={1}>{item.name}</Text>
                                            <Text style={[styles.sessionFoodMeta, { color: colors.text.tertiary }]}>{item.grams}g • {item.calories} kcal</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removeFoodItem(item.id)} style={styles.sessionRemoveBtn}>
                                            <Ionicons name="close" size={18} color={colors.text.tertiary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.doneButtonLarge, { backgroundColor: colors.accent.primary }]}
                                onPress={() => {
                                    setIsSearchActive(false);
                                    setSearchQuery('');
                                    setSelectedFood('');
                                }}
                            >
                                <Text style={styles.doneButtonText}>Finished Logging</Text>
                                <Ionicons name="chevron-forward" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {!isSearchActive && (
                    <>


                        {/* Totals Summary - Impactful Hero Card */}
                        <LinearGradient
                            colors={[colors.accent.primary, colors.accent.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.heroSummaryCard}
                        >
                            <View style={styles.summaryHeader}>
                                <View>
                                    <Text style={styles.summarySubtitle}>Total Meal Calories</Text>
                                    <Text style={styles.summaryValue}>{totals.calories}</Text>
                                </View>
                                <View style={styles.summaryIconCircle}>
                                    <Ionicons name="flame" size={32} color="white" />
                                </View>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.macroStrip}>
                                <View style={styles.macroBox}>
                                    <Text style={styles.macroValue}>{totals.protein.toFixed(1)}g</Text>
                                    <Text style={styles.macroLabel}>Protein</Text>
                                </View>
                                <View style={styles.macroBox}>
                                    <Text style={styles.macroValue}>{totals.carbs.toFixed(1)}g</Text>
                                    <Text style={styles.macroLabel}>Carbs</Text>
                                </View>
                                <View style={styles.macroBox}>
                                    <Text style={styles.macroValue}>{totals.fats.toFixed(1)}g</Text>
                                    <Text style={styles.macroLabel}>Fats</Text>
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Custom Foods Quick Access & Creation */}
                        <View style={styles.quickAccessSection}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitleMini, { color: colors.text.tertiary }]}>CUSTOM FOODS</Text>
                                <TouchableOpacity onPress={() => setShowCustomFoodModal(true)}>
                                    <Text style={{ color: colors.accent.primary, fontWeight: '700', fontSize: 12 }}>Manage All</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAccessScroll}>
                                <TouchableOpacity
                                    style={[styles.quickFoodCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary, borderStyle: 'dashed' }]}
                                    onPress={() => setShowCustomFoodModal(true)}
                                >
                                    <View style={[styles.quickFoodIcon, { backgroundColor: colors.background.elevated }]}>
                                        <Ionicons name="add" size={16} color={colors.accent.primary} />
                                    </View>
                                    <Text style={[styles.quickFoodText, { color: colors.accent.primary, fontWeight: '700' }]}>Create New</Text>
                                </TouchableOpacity>

                                {customFoods.map(food => (
                                    <TouchableOpacity
                                        key={food.id}
                                        style={[styles.quickFoodCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}
                                        onPress={() => {
                                            setSelectedFood(`custom-${food.id}`);
                                            setSearchQuery(food.name + ' ⭐');
                                            setIsSearchActive(true);
                                        }}
                                    >
                                        <View style={[styles.quickFoodIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                            <Ionicons name="star" size={14} color={colors.accent.primary} />
                                        </View>
                                        <Text style={[styles.quickFoodText, { color: colors.text.primary }]} numberOfLines={1}>{food.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Meal Type Selection - Moved Here */}
                        <View style={styles.mealTypeSection}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.inputLabel, { color: colors.text.primary, marginBottom: 0 }]}>Meal Category</Text>
                                <TouchableOpacity
                                    style={[styles.manageTypesBtn, { backgroundColor: 'rgba(167, 139, 250, 0.1)' }]}
                                    onPress={() => setShowMealTypeModal(true)}
                                >
                                    <Ionicons name="settings-outline" size={14} color={colors.accent.primary} />
                                    <Text style={[styles.manageTypesText, { color: colors.accent.primary }]}>Manage</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.dropdownTrigger, { backgroundColor: colors.background.card, borderColor: isDropdownOpen ? colors.accent.primary : colors.border.secondary }]}
                                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <View style={styles.dropdownTriggerLeft}>
                                    <View style={[styles.categoryIconCircleSmall, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                        <Ionicons
                                            name={['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(mealType)
                                                ? (mealType === 'Breakfast' ? 'cafe' : mealType === 'Lunch' ? 'restaurant' : mealType === 'Dinner' ? 'moon' : 'fast-food')
                                                : 'star'}
                                            size={16}
                                            color={colors.accent.primary}
                                        />
                                    </View>
                                    <Text style={[styles.selectedTypeText, { color: colors.text.primary }]}>{mealType}</Text>
                                </View>
                                <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.text.tertiary} />
                            </TouchableOpacity>

                            {isDropdownOpen && (
                                <View style={[styles.dropdownList, { backgroundColor: colors.background.elevated, borderColor: colors.border.secondary }]}>
                                    {['Breakfast', 'Lunch', 'Dinner', 'Snack', ...customMealTypes].map((type) => {
                                        const isSelected = mealType === type;
                                        const isDefault = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(type);

                                        return (
                                            <TouchableOpacity
                                                key={type}
                                                style={[styles.dropdownOption, isSelected && { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}
                                                onPress={() => {
                                                    setMealType(type);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                <View style={styles.dropdownOptionLeft}>
                                                    <Ionicons
                                                        name={isDefault ? (type === 'Breakfast' ? 'cafe' : type === 'Lunch' ? 'restaurant' : type === 'Dinner' ? 'moon' : 'fast-food') : 'star-outline'}
                                                        size={18}
                                                        color={isSelected ? colors.accent.primary : colors.text.tertiary}
                                                    />
                                                    <Text style={[styles.dropdownOptionText, { color: isSelected ? colors.accent.primary : colors.text.primary, fontWeight: isSelected ? '700' : '500' }]}>
                                                        {type}
                                                    </Text>
                                                </View>
                                                {isSelected && <Ionicons name="checkmark" size={18} color={colors.accent.primary} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        {/* Added Food Items UI */}
                        {foodItems.length > 0 && (
                            <View style={styles.addedItemsSection}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={[styles.sectionTitleMini, { color: colors.text.tertiary }]}>LOGGED ITEMS</Text>
                                    <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>{foodItems.length} items</Text>
                                </View>
                                {foodItems.map(item => (
                                    <View key={item.id} style={[styles.foodCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                                        <View style={styles.foodCardLeft}>
                                            <View style={[styles.foodDot, { backgroundColor: colors.accent.primary }]} />
                                            <View>
                                                <Text style={[styles.foodName, { color: colors.text.primary }]}>{item.name}</Text>
                                                <Text style={[styles.foodMeta, { color: colors.text.tertiary }]}>
                                                    {item.grams}g • {item.calories} kcal • P: {item.protein}g
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity onPress={() => removeFoodItem(item.id)} style={styles.removeBtn}>
                                            <Ionicons name="remove-circle-outline" size={22} color={colors.status.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Button
                            title={`Save ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
                            onPress={handleSave}
                            style={{ marginTop: spacing.xl }}
                            disabled={foodItems.length === 0}
                        />
                    </>
                )}
            </ScrollView >

            {/* Custom Food Modal */}
            < Modal
                visible={showCustomFoodModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCustomFoodModal(false)
                }
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background.primary, borderColor: colors.accent.primary, borderWidth: 1.5, shadowColor: colors.accent.primary, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Manage Custom Foods</Text>
                            <TouchableOpacity onPress={() => setShowCustomFoodModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <View style={{ marginBottom: spacing.lg }}>
                                <Text style={[styles.label, { color: colors.text.secondary, marginTop: 0 }]}>My Foods</Text>
                                {customFoods.length === 0 ? (
                                    <Text style={{ color: colors.text.tertiary, fontStyle: 'italic' }}>No custom foods added.</Text>
                                ) : (
                                    customFoods.map((food) => (
                                        <View key={food.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border.secondary }}>
                                            <View style={{ flex: 1, paddingRight: 8 }}>
                                                <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '500' }}>{food.name}</Text>
                                                <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>{food.calories} cal • P:{food.protein} • C:{food.carbs} • F:{food.fats}</Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => food.id && handleDeleteCustomFood(food.id)}
                                                style={{ padding: 8, marginRight: -8 }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={colors.status.error} />
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>

                            <View style={{ height: 1, backgroundColor: colors.border.secondary, marginBottom: spacing.lg }} />

                            <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: 16, marginBottom: spacing.sm }]}>Add New Food</Text>

                            <Text style={[styles.label, { color: colors.text.secondary }]}>Food Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                placeholder="e.g., My Protein Shake"
                                placeholderTextColor={colors.text.disabled}
                                value={customFoodName}
                                onChangeText={setCustomFoodName}
                            />

                            <Text style={[styles.helpText, { color: colors.text.tertiary }]}>
                                Enter nutrition per 100g:
                            </Text>

                            <View style={styles.row}>
                                <View style={styles.halfCol}>
                                    <Text style={[styles.label, { color: colors.text.secondary }]}>Calories</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.text.disabled}
                                        keyboardType="numeric"
                                        value={customCalories}
                                        onChangeText={setCustomCalories}
                                    />
                                </View>
                                <View style={styles.halfCol}>
                                    <Text style={[styles.label, { color: colors.text.secondary }]}>Protein (g)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.text.disabled}
                                        keyboardType="numeric"
                                        value={customProtein}
                                        onChangeText={setCustomProtein}
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfCol}>
                                    <Text style={[styles.label, { color: colors.text.secondary }]}>Carbs (g)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.text.disabled}
                                        keyboardType="numeric"
                                        value={customCarbs}
                                        onChangeText={setCustomCarbs}
                                    />
                                </View>
                                <View style={styles.halfCol}>
                                    <Text style={[styles.label, { color: colors.text.secondary }]}>Fats (g)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.text.disabled}
                                        keyboardType="numeric"
                                        value={customFats}
                                        onChangeText={setCustomFats}
                                    />
                                </View>
                            </View>

                            <Button
                                title="Add Custom Food"
                                onPress={handleAddCustomFood}
                                style={{ marginTop: spacing.lg }}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal >
            {/* Custom Meal Type Modal */}
            <Modal
                visible={showMealTypeModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowMealTypeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background.primary, borderColor: colors.accent.primary, borderWidth: 1.5, shadowColor: colors.accent.primary, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Manage Meal Types</Text>
                            <TouchableOpacity onPress={() => setShowMealTypeModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.label, { color: colors.text.secondary, marginTop: 0 }]}>My Custom Types</Text>
                        <ScrollView style={{ maxHeight: 150, marginBottom: spacing.lg }}>
                            {customMealTypes.length === 0 ? (
                                <Text style={{ color: colors.text.tertiary, fontStyle: 'italic', paddingVertical: 8 }}>No custom types added yet.</Text>
                            ) : (
                                customMealTypes.map((type, index) => (
                                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border.secondary }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Ionicons name="star-outline" size={16} color={colors.accent.secondary} />
                                            <Text style={{ color: colors.text.primary, fontSize: 16 }}>{type}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteCustomMealType(type)}
                                            style={{ padding: 8, marginRight: -8 }}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={colors.status.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <Text style={[styles.label, { color: colors.text.secondary }]}>Add New Type</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                            placeholder="e.g., Pre-workout, Late Snack"
                            placeholderTextColor={colors.text.disabled}
                            value={newMealTypeName}
                            onChangeText={setNewMealTypeName}
                        />

                        <Button
                            title="Add"
                            onPress={handleAddCustomMealType}
                            style={{ marginTop: spacing.lg }}
                        />
                    </View>
                </View>
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal
                visible={!!deleteModal?.visible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteModal(null)}
            >
                <View style={styles.deleteOverlay}>
                    <View style={[styles.confirmModal, { backgroundColor: colors.background.elevated, borderColor: colors.accent.primary, borderWidth: 1.5, shadowColor: colors.accent.primary, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 }]}>
                        <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>
                            Delete {deleteModal?.type === 'mealType' ? 'Meal Type' : 'Food'}
                        </Text>
                        <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
                            Are you sure you want to delete "{deleteModal?.name}"?
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.background.card }]}
                                onPress={() => setDeleteModal(null)}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.status.error }]}
                                onPress={confirmDelete}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.xl,
        paddingBottom: 100,
    },
    searchContentActive: {
        paddingTop: spacing.md,
    },
    mealTypeSection: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        opacity: 0.8,
    },
    manageTypesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    manageTypesText: {
        fontSize: 12,
        fontWeight: '700',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1.5,
        marginTop: 14,
        ...shadows.sm,
    },
    dropdownTriggerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    categoryIconCircleSmall: {
        width: 36,
        height: 36,
        borderRadius: 12, // Squircle look
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedTypeText: {
        fontSize: 17,
        fontWeight: '700',
    },
    dropdownList: {
        marginTop: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        overflow: 'hidden',
        ...shadows.lg,
    },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    dropdownOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    dropdownOptionText: {
        fontSize: 16,
    },
    heroSummaryCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: spacing.xl,
        ...shadows.md,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summarySubtitle: {
        color: 'white',
        fontSize: 12,
        opacity: 0.8,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryValue: {
        color: 'white',
        fontSize: 28,
        fontWeight: '800',
    },
    summaryIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 12,
    },
    macroStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 12,
    },
    macroBox: {
        alignItems: 'center',
        flex: 1,
    },
    macroValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    macroLabel: {
        color: 'white',
        fontSize: 10,
        opacity: 0.8,
        fontWeight: '600',
    },
    quickAccessSection: {
        marginBottom: spacing.xxl,
    },
    sectionTitleMini: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: spacing.md,
    },
    quickAccessScroll: {
        paddingRight: spacing.xl,
    },
    quickFoodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingRight: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 10,
        gap: 10,
    },
    quickFoodIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickFoodText: {
        fontSize: 13,
        fontWeight: '600',
        maxWidth: 120,
    },
    addedItemsSection: {
        marginBottom: spacing.xxl,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    foodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
        ...shadows.sm,
    },
    foodCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    foodDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    foodName: {
        fontSize: 15,
        fontWeight: '700',
    },
    foodMeta: {
        fontSize: 12,
        marginTop: 2,
    },
    removeBtn: {
        padding: 4,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    customFoodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    customFoodButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
    searchSection: {
        marginBottom: spacing.xxl,
        paddingTop: 16,
    },
    searchSectionActive: {
        marginTop: 0,
        flex: 1,
        paddingTop: 12,
    },
    cancelSearchBtn: {
        paddingLeft: 12,
        paddingVertical: 8,
    },
    backButtonIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchTitleLarge: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -1,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60, // Slightly taller for more presence
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInputInline: {
        flex: 1,
        fontSize: 17,
        height: '100%',
        fontWeight: '500',
    },
    searchResultsWrapper: {
        borderRadius: 20,
        borderWidth: 1.5,
        marginTop: 16,
        overflow: 'hidden',
        flex: 1,
        ...shadows.md,
    },
    dropdownScroll: {
        flex: 1,
    },
    dropdownContent: {
        flex: 1,
    },
    emptyResults: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectionFocusContainer: {
        marginTop: 16,
    },
    focusedFoodCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 2,
        ...shadows.md,
    },
    focusedFoodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    focusedFoodInfo: {
        flex: 1,
    },
    focusedFoodName: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    focusedFoodMeta: {
        fontSize: 14,
        opacity: 0.7,
    },
    changeFoodBtn: {
        padding: 4,
    },
    unitSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: 4,
        borderRadius: 14,
        marginBottom: 20,
    },
    unitTab: {
        flex: 1,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    unitTabText: {
        fontSize: 13,
        fontWeight: '700',
    },
    sizeOptionsWrapper: {
        marginBottom: 20,
    },
    sizeLabel: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        paddingLeft: 4,
    },
    sizeGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    sizeBtn: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sizeBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    sizeBtnSubtext: {
        fontSize: 11,
        marginTop: 2,
    },
    gramsActionRowFocused: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    gramsInputWrapperFocused: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        paddingHorizontal: 16,
        borderRadius: 18,
        borderWidth: 1.5,
    },
    gramsActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 16,
    },
    gramsInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    gramsInputInline: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        height: '100%',
    },
    unitLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    addBtnLarge: {
        width: 54,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
    },
    dropdownItem: {
        padding: 16,
        borderBottomWidth: 1,
    },
    dropdownText: {
        fontSize: 15,
        fontWeight: '600',
    },
    dropdownSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
    sessionLogSection: {
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1.5,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    sessionLogHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sessionBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 32,
        alignItems: 'center',
    },
    sessionList: {
        marginBottom: 24,
    },
    sessionFoodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 10,
        ...shadows.sm,
    },
    sessionFoodInfo: {
        flex: 1,
    },
    sessionFoodName: {
        fontSize: 15,
        fontWeight: '700',
    },
    sessionFoodMeta: {
        fontSize: 13,
        marginTop: 2,
        opacity: 0.6,
    },
    sessionRemoveBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    doneButtonLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 64,
        borderRadius: 20,
        gap: 12,
        ...shadows.md,
    },
    doneButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        height: 54,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfCol: {
        flex: 1,
    },
    helpText: {
        fontSize: 12,
        marginTop: 16,
        fontStyle: 'italic',
        opacity: 0.7,
    },
    deleteOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    confirmModal: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 12,
    },
    confirmText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
