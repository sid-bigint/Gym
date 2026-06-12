import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CalorieCalculator } from '../../src/components/CalorieCalculator';
import { accentColors, shadows, spacing, ThemeType } from '../../src/constants/theme';
import { BADGES } from '../../src/constants/badges';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useHealthConnectStore } from '../../src/store/useHealthConnectStore';
import { useNotesStore } from '../../src/store/useNotesStore';
import { useProgressStore } from '../../src/store/useProgressStore';
import { useScreenPadding } from '../../src/store/useScreenPadding';
import { useTheme } from '../../src/store/useTheme';
import { useUserStore } from '../../src/store/useUserStore';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { useNutritionStore } from '../../src/store/useNutritionStore';
import { subDays, startOfDay, isWithinInterval } from 'date-fns';
import { useAlertStore } from '../../src/store/useAlertStore';
import LevelInfoModal from '../../src/components/dashboard/LevelInfoModal';
import { DataExportService } from '../../src/services/DataExportService';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const { user } = useUserStore();
    const { user: authUser } = useAuthStore();
    const { logout, deleteAccount } = useAuthStore();
    const { measurements, loadMeasurements, deleteMeasurement, addMeasurement } = useProgressStore();
    const { history: workoutHistory, loadHistory: loadWorkoutHistory } = useWorkoutStore();
    const {
        todaySteps,
        isAvailable: isHealthConnectAvailable,
        hasStepPermission,
        isLoading: isHealthConnectLoading,
        lastSyncedAt,
        error: healthConnectError,
        bootstrap: bootstrapHealthConnect,
        connectAndSync,
        openPermissionsScreen,
        openHealthConnectApp,
    } = useHealthConnectStore();
    const { mode, setThemeMode, themeType, setThemeType, colors, initTheme } = useTheme();
    const { contentTop } = useScreenPadding();


    const [showCalculator, setShowCalculator] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isLogging, setIsLogging] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [showLevelInfo, setShowLevelInfo] = useState(false);

    useEffect(() => {
        initTheme();
        loadMeasurements();
        bootstrapHealthConnect();
        loadWorkoutHistory();
    }, []);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const imageUri = asset.uri; // Or `data:image/jpeg;base64,${asset.base64}` if you want to store base64 in DB (heavier)

            // For now, we store URI. Note: Local variable URIs might not persist well across installs/updates if not copied.
            // But usually this works for cache. Ideally, copy to document directory.
            // For simplicity in this step:

            await useUserStore.getState().updateProfile({ ...user, picture: imageUri });
            await useUserStore.getState().loadUser();
        }
    };

    const handleSyncGoogleImage = async () => {
        if (authUser?.picture) {
            await useUserStore.getState().updateProfile({ ...user, picture: authUser.picture });
            // Reload user to update UI
            await useUserStore.getState().loadUser();
            useAlertStore.getState().showAlert("Success", "Profile photo updated from Google account.");
        } else {
            useAlertStore.getState().showAlert("Error", "No Google profile picture found.");
        }
    };

    const handleAvatarPress = () => {
        const options: any[] = [
            { text: "Cancel", style: "cancel" }
        ];

        // Always add Gallery option
        options.push({
            text: "Choose from Library",
            onPress: pickImage
        });

        if (authUser?.picture) {
            options.push({
                text: "Use Google Profile Picture",
                onPress: handleSyncGoogleImage
            });
        }

        if (user?.picture) {
            options.push({
                text: "Remove Current Photo",
                style: "destructive",
                onPress: async () => {
                    await useUserStore.getState().updateProfile({ ...user, picture: null });
                    await useUserStore.getState().loadUser();
                }
            });
        }

        useAlertStore.getState().showAlert("Change Profile Photo", "Choose an option to update your profile picture.", options);
    };

    const handleExportData = async () => {
        if (!user?.id) return;
        
        setIsExporting(true);
        try {
            await DataExportService.exportAllDataAsPDF(String(user.id));
            useAlertStore.getState().showAlert('Export Success', 'Your progress report has been generated and is ready to share.');
        } catch (error) {
            useAlertStore.getState().showAlert('Export Failed', 'Something went wrong while generating your PDF report.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleLogout = async () => {
        useAlertStore.getState().showAlert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/auth/login');
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = async () => {
        useAlertStore.getState().showAlert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone and will permanently erase all your data.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteAccount();
                            router.replace('/auth/login');
                        } catch (error: any) {
                            useAlertStore.getState().showAlert("Error", error.message || "Failed to delete account. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteWeight = (id: number) => {
        setDeleteId(id);
    };

    const handleLogWeight = async () => {
        if (!newWeight) return;
        try {
            // If editing, use the original date to update that specific record
            const dateToLog = editingItem ? editingItem.date : new Date().toISOString();

            await addMeasurement({ weight: Number(newWeight) }, dateToLog);

            setNewWeight('');
            setEditingItem(null); // Reset edit mode
            setIsLogging(false);

            useAlertStore.getState().showAlert("Success", editingItem ? "Weight entry updated!" : "Weight logged successfully!");
        } catch (error) {
            useAlertStore.getState().showAlert("Error", "Failed to log weight. Please try again.");
        }
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteMeasurement(deleteId);
            setDeleteId(null);
        }
    };

    const latestWeight = measurements[0]?.weight || user?.weight || 0;
    const notebookItems = useNotesStore((s) => s.items);
    const totalWorkouts = useMemo(() => workoutHistory.length, [workoutHistory]);
    const totalDaysActive = useMemo(() => {
        const uniqueDates = new Set(workoutHistory.map(w => format(new Date(w.date), 'yyyy-MM-dd')));
        return uniqueDates.size;
    }, [workoutHistory]);
    const weightChange = measurements.length >= 2
        ? (measurements[0].weight - measurements[1].weight).toFixed(1)
        : 0;

    // --- P2: Weekly Summary Calculations ---
    const last7Days = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            days.push(subDays(startOfDay(new Date()), i));
        }
        return days;
    }, []);

    const weeklyStats = useMemo(() => {
        const workouts = workoutHistory.filter(w => 
            isWithinInterval(new Date(w.date), { start: last7Days[0], end: new Date() })
        );
        
        // This is a simplification; in a real app, you'd fetch nutrition data for the whole week
        // For now, we'll just show the workout count and total duration
        const totalDuration = workouts.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
        
        return {
            workoutCount: workouts.length,
            hoursSpent: (totalDuration / 3600).toFixed(1),
            avgCals: user?.calorieGoal || 0, // Placeholder
        };
    }, [workoutHistory, last7Days, user]);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background.primary }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Dynamic Status Bar Spacer based on active workout */}
            <View style={{ height: contentTop }} />

            {/* Extraordinary RPG-style Character Stat Card */}
            <View style={styles.profileHeaderWrapper}>
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => setShowLevelInfo(true)}
                >
                    <LinearGradient
                        colors={
                            mode === 'dark' 
                                ? [colors.accent.primary + '40', colors.accent.secondary + '20', '#020617'] 
                                : [colors.accent.primary + '15', colors.accent.secondary + '05', '#ffffff']
                        }
                        locations={[0, 0.4, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.profileHeaderCardCentered, { borderColor: colors.accent.primary + '40', borderWidth: 1.5 }]}
                    >
                        {/* Decorative Patterns & Glows */}
                        <Ionicons name="hardware-chip-outline" size={280} color={colors.accent.primary} style={[styles.bgIconLarge, { opacity: mode === 'dark' ? 0.12 : 0.04 }]} />
                        <View style={[styles.cardGlowCentered, { backgroundColor: colors.accent.primary, opacity: mode === 'dark' ? 0.4 : 0.15 }]} />
                        <View style={[styles.cardGlowSecondaryCentered, { backgroundColor: colors.accent.secondary, opacity: mode === 'dark' ? 0.3 : 0.1 }]} />

                        <View style={styles.cardTopSectionCentered}>
                            <View style={styles.avatarWrapperCentered}>
                                <LinearGradient
                                    colors={[colors.accent.primary, colors.accent.secondary]}
                                    style={styles.avatarGradientRing}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={[styles.avatarContainerCentered, { backgroundColor: colors.background.card }]}>
                                        {(user?.picture || authUser?.picture) ? (
                                            <Image source={{ uri: (user?.picture || authUser?.picture) as string }} style={styles.profileAvatarCentered} />
                                        ) : (
                                            <View style={[styles.avatarPlaceholderCentered, { backgroundColor: colors.background.elevated }]}>
                                                <Ionicons name="person" size={40} color={colors.text.tertiary} />
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>
                                <TouchableOpacity 
                                    style={[styles.editPhotoBtnCentered, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]} 
                                    onPress={handleAvatarPress}
                                >
                                    <Ionicons name="camera" size={14} color={colors.text.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.headerTextSectionCentered}>
                                <View style={[styles.rankBadgeGoldCentered, { backgroundColor: colors.accent.primary + '15', borderColor: colors.accent.primary + '30' }]}>
                                    <Ionicons name="shield-checkmark" size={12} color={colors.accent.primary} />
                                    <Text style={[styles.rankBadgeTextCentered, { color: colors.accent.primary }]}>
                                        {(user?.level || 1) < 5 ? 'NOVICE ATHLETE' : (user?.level || 1) < 15 ? 'WARRIOR' : 'ELITE TITAN'}
                                    </Text>
                                </View>
                                <Text style={[styles.profileNameMainCentered, { color: colors.text.primary }]}>{user?.name || 'Athlete'}</Text>
                            </View>
                            
                            <View style={[styles.miniStatsRowCentered, { backgroundColor: colors.background.elevated, borderColor: colors.border.secondary }]}>
                                <View style={styles.miniStatItemCentered}>
                                    <Text style={[styles.miniStatValueCentered, { color: colors.text.primary }]}>{totalWorkouts}</Text>
                                    <Text style={[styles.miniStatLabelCentered, { color: colors.text.tertiary }]}>Workouts</Text>
                                </View>
                                <View style={[styles.miniStatDivider, { backgroundColor: colors.border.secondary }]} />
                                <View style={styles.miniStatItemCentered}>
                                    <Text style={[styles.miniStatValueCentered, { color: colors.text.primary }]}>{user?.xp || 0}</Text>
                                    <Text style={[styles.miniStatLabelCentered, { color: colors.text.tertiary }]}>Total XP</Text>
                                </View>
                                <View style={[styles.miniStatDivider, { backgroundColor: colors.border.secondary }]} />
                                <View style={styles.miniStatItemCentered}>
                                    <Text style={[styles.miniStatValueCentered, { color: colors.text.primary }]}>{user?.streakShields || 0}</Text>
                                    <Text style={[styles.miniStatLabelCentered, { color: colors.text.tertiary }]}>Shields</Text>
                                </View>
                            </View>
                        </View>

                        {/* Enhanced XP Bar */}
                        <View style={styles.xpProgressSectionCentered}>
                            <View style={styles.xpLabelRowCentered}>
                                <Text style={[styles.xpLabelLeftCentered, { color: colors.text.primary }]}>LEVEL <Text style={{color: colors.accent.primary}}>{user?.level || 1}</Text></Text>
                                <Text style={[styles.xpLabelRightCentered, { color: colors.text.tertiary }]}>{Math.round(Math.min(((user?.xp || 0) / ((user?.level || 1) * 100)) * 100, 100))}% to next</Text>
                            </View>
                            <View style={[styles.xpBarContainerNewCentered, { backgroundColor: colors.background.elevated }]}>
                                <LinearGradient
                                    colors={[colors.accent.primary, colors.accent.secondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.xpBarFillNewCentered, { width: `${Math.min(((user?.xp || 0) / ((user?.level || 1) * 100)) * 100, 100)}%` }]}
                                >
                                    <View style={styles.xpBarShineCentered} />
                                </LinearGradient>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <LevelInfoModal 
                    visible={showLevelInfo} 
                    onClose={() => setShowLevelInfo(false)} 
                    user={user} 
                />
            </View>

            <View style={styles.content}>
                {/* Section: Body Stats */}
                <View style={styles.sectionHeaderNew}>
                    <Text style={[styles.sectionTitleNew, { color: colors.text.primary }]}>Body Stats</Text>
                    <TouchableOpacity onPress={() => setShowHistory(true)}>
                        <Text style={{ color: colors.accent.primary, fontWeight: '700', fontSize: 13 }}>View History</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.statsRowNew]}>
                    <View style={[styles.statBox, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                        <View>
                            <View style={[styles.statIconCircle, { backgroundColor: colors.accent.primary + '15' }]}>
                                <Ionicons name="scale-outline" size={20} color={colors.accent.primary} />
                            </View>
                            <Text style={[styles.statValueNew, { color: colors.text.primary }]}>{latestWeight}</Text>
                            <Text style={[styles.statLabelNew, { color: colors.text.tertiary }]}>Weight (kg)</Text>
                        </View>
                        
                        {Number(weightChange) !== 0 && (
                            <View style={[styles.trendBadge, { backgroundColor: Number(weightChange) < 0 ? '#10B98120' : '#EF444420' }]}>
                                <Text style={[styles.trendText, { color: Number(weightChange) < 0 ? '#10B981' : '#EF4444' }]}>
                                    {Number(weightChange) > 0 ? '+' : ''}{weightChange}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#F59E0B15' }]}>
                            <Ionicons name="calculator-outline" size={20} color="#F59E0B" />
                        </View>
                        <Text style={[styles.statValueNew, { color: colors.text.primary }]}>{user?.calorieGoal || '0'}</Text>
                        <Text style={[styles.statLabelNew, { color: colors.text.tertiary }]}>Target kCal</Text>
                    </View>
                </View>

                {/* Section: Daily Targets */}
                <Text style={[styles.sectionTitleNew, { color: colors.text.primary, marginTop: 24, marginBottom: 14 }]}>Daily Targets</Text>
                <View style={[styles.targetsList, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                    <View style={styles.targetItem}>
                        <View style={styles.targetInfo}>
                            <View style={[styles.targetDot, { backgroundColor: colors.nutrition.protein }]} />
                            <Text style={[styles.targetName, { color: colors.text.primary }]}>Protein</Text>
                        </View>
                        <Text style={[styles.targetValue, { color: colors.text.primary }]}>{user?.targetProtein || 0}g</Text>
                    </View>
                    <View style={styles.dividerNew} />
                    <View style={styles.targetItem}>
                        <View style={styles.targetInfo}>
                            <View style={[styles.targetDot, { backgroundColor: colors.nutrition.carbs }]} />
                            <Text style={[styles.targetName, { color: colors.text.primary }]}>Carbs</Text>
                        </View>
                        <Text style={[styles.targetValue, { color: colors.text.primary }]}>{user?.targetCarbs || 0}g</Text>
                    </View>
                    <View style={styles.dividerNew} />
                    <View style={styles.targetItem}>
                        <View style={styles.targetInfo}>
                            <View style={[styles.targetDot, { backgroundColor: colors.nutrition.fats }]} />
                            <Text style={[styles.targetName, { color: colors.text.primary }]}>Fats</Text>
                        </View>
                        <Text style={[styles.targetValue, { color: colors.text.primary }]}>{user?.targetFats || 0}g</Text>
                    </View>
                </View>

                {/* Section: Preferences & Tools */}
                <Text style={[styles.sectionTitleNew, { color: colors.text.primary, marginTop: 24, marginBottom: 14 }]}>Preferences & Tools</Text>



                <TouchableOpacity
                    style={[styles.menuItemNew, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}
                    onPress={() => setShowCalculator(true)}
                >
                    <View style={[styles.menuIconCircle, { backgroundColor: colors.accent.primary + '15' }]}>
                        <Ionicons name="calculator" size={20} color={colors.accent.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.menuItemTitle, { color: colors.text.primary }]}>Calorie Calculator</Text>
                        <Text style={[styles.menuItemSub, { color: colors.text.tertiary }]}>Fine-tune your daily calorie & macro goals</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.text.disabled} />
                </TouchableOpacity>

                <View style={[styles.menuItemNew, {
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.secondary,
                    paddingVertical: 16,
                    flexDirection: 'column',
                    alignItems: 'stretch'
                }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 14 }}>
                        <View style={[styles.menuIconCircle, { backgroundColor: colors.accent.primary + '15' }]}>
                            <Ionicons name="color-palette" size={20} color={colors.accent.primary} />
                        </View>
                        <Text style={[styles.menuItemTitle, { color: colors.text.primary, flex: 1 }]}>App Theme</Text>
                        <View style={styles.themeToggleNew}>
                            <TouchableOpacity onPress={() => setThemeMode('light')} style={styles.themeToggleBtn}>
                                <Ionicons name="sunny" size={16} color={mode === 'light' ? colors.accent.primary : colors.text.disabled} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setThemeMode('dark')} style={styles.themeToggleBtn}>
                                <Ionicons name="moon" size={16} color={mode === 'dark' ? colors.accent.primary : colors.text.disabled} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}>
                        {(Object.keys(accentColors) as ThemeType[]).map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setThemeType(type)}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: accentColors[type].primary },
                                    themeType === type && { borderColor: colors.text.primary, borderWidth: 3 }
                                ]}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Data & Privacy */}
                <View style={[styles.dataCard, { backgroundColor: colors.background.card, borderColor: colors.border.secondary, marginTop: 24 }]}>
                    <View style={styles.dataInfo}>
                        <Ionicons name="shield-checkmark" size={24} color={colors.accent.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.dataTitle, { color: colors.text.primary }]}>Your Data, Your Control</Text>
                            <Text style={[styles.dataDesc, { color: colors.text.tertiary }]}>
                                Export a complete archive of your workout history, nutrition logs, and progress measurements.
                            </Text>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.exportBtn, { backgroundColor: colors.accent.primary }]}
                        onPress={handleExportData}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="sync" size={18} color="white" />
                                <Text style={styles.exportBtnText}>Compiling...</Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="document-text-outline" size={18} color="white" />
                                <Text style={styles.exportBtnText}>Export Progress Report (PDF)</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Legal */}
                <Text style={[styles.sectionTitleNew, { color: colors.text.primary, marginTop: 24, marginBottom: 14 }]}>Legal</Text>
                <TouchableOpacity
                    style={[styles.menuItemNew, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}
                    onPress={() => Linking.openURL('https://sid-bigint.github.io/gymGuide360/privacy-policy.html')}
                >
                    <View style={[styles.menuIconCircle, { backgroundColor: '#6366F115' }]}>
                        <Ionicons name="document-text-outline" size={20} color="#6366F1" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.menuItemTitle, { color: colors.text.primary }]}>Privacy Policy</Text>
                        <Text style={[styles.menuItemSub, { color: colors.text.tertiary }]}>How we handle your data</Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color={colors.text.disabled} />
                </TouchableOpacity>

                {/* Account Actions */}
                <View style={[styles.actionRowNew, { marginTop: 24 }]}>
                    <TouchableOpacity
                        style={[styles.actionBtnSecondary, { borderColor: colors.border.primary }]}
                        onPress={() => router.push('/onboarding')}
                    >
                        <Ionicons name="settings-outline" size={18} color={colors.text.secondary} />
                        <Text style={[styles.actionBtnTextSec, { color: colors.text.secondary }]}>Update Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtnPrimary, { backgroundColor: '#EF4444' + '10' }]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                        <Text style={[styles.actionBtnTextSec, { color: '#EF4444' }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Delete Account */}
                <TouchableOpacity
                    style={[styles.actionBtnPrimary, { backgroundColor: '#EF4444' + '15', marginTop: 12, paddingVertical: 14 }]}
                    onPress={handleDeleteAccount}
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '800', marginLeft: 8 }}>Delete Account</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </View>

            {/* Weight History Modal */}
            <Modal
                visible={showHistory}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowHistory(false);
                    setEditingItem(null);
                    setNewWeight('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border.secondary }]}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowHistory(false);
                                    setEditingItem(null);
                                    setNewWeight('');
                                }}
                                style={{ padding: 4 }}
                            >
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                            <Text style={[styles.title, { color: colors.text.primary, flex: 1, textAlign: 'center' }]}>Weight History</Text>
                            <View style={{ width: 32 }} />
                        </View>

                        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                            {/* Input Form at Top */}
                            <View style={[styles.logContainer, { backgroundColor: colors.background.card }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        color: editingItem ? colors.accent.primary : colors.text.secondary,
                                        fontWeight: '700',
                                        fontSize: 12,
                                        marginBottom: 8
                                    }}>
                                        {editingItem
                                            ? `Update entry for ${format(new Date(editingItem.date), 'MMM dd')}`
                                            : "Log New Weight (Today)"}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TextInput
                                            style={[styles.input, {
                                                backgroundColor: colors.background.elevated,
                                                color: colors.text.primary,
                                                borderColor: colors.border.primary,
                                                flex: 1
                                            }]}
                                            placeholder="Enter weight..."
                                            placeholderTextColor={colors.text.disabled}
                                            keyboardType="numeric"
                                            value={newWeight}
                                            onChangeText={setNewWeight}
                                        />
                                        <Text style={{ position: 'absolute', right: 16, color: colors.text.tertiary, fontSize: 14 }}>kg</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: editingItem ? colors.accent.primary : colors.accent.success }]}
                                    onPress={handleLogWeight}
                                >
                                    <Ionicons name={editingItem ? "save" : "add"} size={24} color={colors.text.inverse} />
                                </TouchableOpacity>
                            </View>

                            {/* List Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                                <Text style={{ color: colors.text.secondary, fontWeight: '700', fontSize: 14 }}>Recent Entries</Text>
                                {editingItem && (
                                    <TouchableOpacity onPress={() => { setEditingItem(null); setNewWeight(''); }}>
                                        <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>Cancel Edit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {measurements.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="barbell-outline" size={48} color={colors.text.disabled} />
                                    <Text style={[styles.emptyText, { color: colors.text.disabled }]}>No measurements yet</Text>
                                </View>
                            ) : (
                                <View style={styles.weightList}>
                                    {measurements.map((m, index) => (
                                        <TouchableOpacity
                                            key={m.id}
                                            style={[
                                                styles.weightRow,
                                                {
                                                    borderBottomColor: colors.border.secondary,
                                                    backgroundColor: editingItem?.id === m.id ? colors.accent.primary + '10' : 'transparent',
                                                    borderRadius: 12,
                                                    paddingHorizontal: 8
                                                }
                                            ]}
                                            onPress={() => {
                                                setEditingItem(m);
                                                setNewWeight(m.weight.toString());
                                            }}
                                        >
                                            <View style={styles.weightLeft}>
                                                <View style={[styles.weightDot, { backgroundColor: index === 0 ? colors.accent.primary : colors.text.disabled }]} />
                                                <View>
                                                    <Text style={[styles.weightDate, { color: colors.text.primary }]}>
                                                        {format(new Date(m.date), 'MMM dd, yyyy')}
                                                    </Text>
                                                    <Text style={[styles.weightTime, { color: colors.text.disabled }]}>
                                                        {format(new Date(m.date), 'h:mm a')}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.weightRight}>
                                                <Text style={[styles.weightValue, { color: colors.text.primary }]}>{m.weight}</Text>
                                                <Text style={[styles.weightUnit, { color: colors.text.tertiary }]}>kg</Text>
                                                <TouchableOpacity
                                                    onPress={(e) => {
                                                        e.stopPropagation(); // Prevent edit mode triggering
                                                        handleDeleteWeight(m.id);
                                                    }}
                                                    style={{ marginLeft: spacing.md, padding: 4 }}
                                                >
                                                    <Ionicons name="trash-outline" size={20} color={colors.accent.warning} />
                                                </TouchableOpacity>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={!!deleteId}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteId(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.confirmModal, { backgroundColor: colors.background.elevated }]}>
                        <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>Delete Entry?</Text>
                        <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
                            Are you sure you want to remove this weight entry? This action cannot be undone.
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.background.card }]}
                                onPress={() => setDeleteId(null)}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.accent.warning }]}
                                onPress={confirmDelete}
                            >
                                <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Calorie Calculator Component */}
            <CalorieCalculator
                visible={showCalculator}
                onClose={() => setShowCalculator(false)}
                initialValues={{
                    weight: user?.weight,
                    height: user?.height,
                    age: user?.age,
                    gender: user?.gender,
                    activityLevel: user?.activityLevel,
                    goal: user?.goal,
                    bodyFatPercent: user?.bodyFatPercent,
                    sleepHours: user?.sleepHours,
                    mealsPerDay: user?.mealsPerDay,
                    goalIntensity: user?.goalIntensity,
                    workoutType: user?.workoutType,
                    workoutDuration: user?.workoutDuration,
                    workoutFrequency: user?.workoutFrequency
                }}
                onSave={async (results) => {
                    try {
                        if (user) {
                            // Update user profile with calculated values
                            await useUserStore.getState().updateProfile({
                                ...user,
                                weight: results.weight,
                                height: results.height,
                                age: results.age,
                                gender: results.gender,
                                activityLevel: results.activityLevel as any,
                                goal: results.goal,
                                calorieGoal: results.calories,
                                targetProtein: results.protein,
                                targetCarbs: results.carbs,
                                targetFats: results.fats,
                                bodyFatPercent: results.bodyFatPercent,
                                sleepHours: results.sleepHours,
                                mealsPerDay: results.mealsPerDay,
                                goalIntensity: results.goalIntensity,
                                workoutType: results.workoutType,
                                workoutDuration: results.workoutDuration,
                                workoutFrequency: results.workoutFrequency,
                            });

                            // Reload user data to show updated values
                            await useUserStore.getState().loadUser();

                            useAlertStore.getState().showAlert('Success', 'Profile updated successfully!');
                        }
                    } catch (error) {
                        console.error('Failed to update profile:', error);
                        useAlertStore.getState().showAlert('Error', 'Failed to update profile. Please try again.');
                    }
                }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileHeaderWrapper: {
        paddingHorizontal: spacing.xl,
        marginTop: 20,
    },
    profileHeaderCardCentered: {
        borderRadius: 32,
        padding: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    cardGlowCentered: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    cardGlowSecondaryCentered: {
        position: 'absolute',
        bottom: -40,
        left: -60,
        width: 160,
        height: 160,
        borderRadius: 80,
    },
    bgIconLarge: {
        position: 'absolute',
        bottom: -60,
        left: -40,
        transform: [{ rotate: '-20deg' }],
    },
    cardTopSectionCentered: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapperCentered: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarGradientRing: {
        padding: 3,
        borderRadius: 50,
    },
    avatarContainerCentered: {
        width: 86,
        height: 86,
        borderRadius: 43,
        padding: 4,
    },
    profileAvatarCentered: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    avatarPlaceholderCentered: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editPhotoBtnCentered: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerTextSectionCentered: {
        alignItems: 'center',
        width: '100%',
    },
    rankBadgeGoldCentered: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    rankBadgeTextCentered: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    profileNameMainCentered: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 20,
    },
    miniStatsRowCentered: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    miniStatItemCentered: {
        alignItems: 'center',
        flex: 1,
    },
    miniStatValueCentered: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    miniStatLabelCentered: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    miniStatDivider: {
        width: 1,
        height: 24,
    },
    xpProgressSectionCentered: {
        width: '100%',
    },
    xpLabelRowCentered: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    xpLabelLeftCentered: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    xpLabelRightCentered: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    xpBarContainerNewCentered: {
        height: 8,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    xpBarFillNewCentered: {
        height: '100%',
        borderRadius: 4,
        position: 'relative',
    },
    xpBarShineCentered: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    content: {
        paddingTop: 24,
        paddingHorizontal: spacing.xl,
    },
    achievementsWrapper: {
        marginTop: 32,
        paddingHorizontal: spacing.xl,
    },
    badgeScroll: {
        gap: 12,
        paddingVertical: 8,
    },
    badgeCard: {
        width: 100,
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    badgeIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    badgeName: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    lockIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    weeklySummaryCard: {
        padding: 20,
        borderRadius: 28,
        borderWidth: 1,
        marginBottom: 32,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    summaryGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    sectionHeaderNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    dataCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        gap: 20,
    },
    dataInfo: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    dataTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    dataDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    exportBtn: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    exportBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    sectionTitleNew: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    statsRowNew: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        ...shadows.sm,
    },
    statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValueNew: {
        fontSize: 22,
        fontWeight: '900',
    },
    statLabelNew: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    trendBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '800',
    },
    targetsList: {
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        ...shadows.sm,
    },
    targetItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    targetInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    targetDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    targetName: {
        fontSize: 15,
        fontWeight: '700',
    },
    targetValue: {
        fontSize: 15,
        fontWeight: '800',
    },
    dividerNew: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.03)',
        marginVertical: 4,
    },
    menuItemNew: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
        gap: 14,
        ...shadows.sm,
    },
    menuIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    menuItemSub: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    themeToggleNew: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 4,
        borderRadius: 10,
    },
    themeToggleBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionRowNew: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
    },
    actionBtnSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 18,
        borderWidth: 1.5,
    },
    actionBtnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 18,
    },
    actionBtnTextSec: {
        fontSize: 15,
        fontWeight: '800',
    },
    // Keep internal modal styles same but refined
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        height: '85%',
        paddingTop: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
    },
    logContainer: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        alignItems: 'center',
        gap: 12,
    },
    input: {
        height: 54,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '700',
    },
    saveButton: {
        width: 54,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weightList: {
        paddingBottom: 40,
    },
    weightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    weightLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    weightDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    weightDate: {
        fontSize: 15,
        fontWeight: '700',
    },
    weightTime: {
        fontSize: 12,
        opacity: 0.5,
    },
    weightRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weightValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    weightUnit: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 2,
    },
    confirmModal: {
        width: '85%',
        padding: 24,
        borderRadius: 32,
        alignSelf: 'center',
        marginTop: 'auto',
        marginBottom: 'auto',
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 12,
    },
    confirmText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        opacity: 0.8,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    confirmButton: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '800',
    },
    colorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    }
});
