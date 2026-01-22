import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Modal, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../../src/store/useUserStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useProgressStore } from '../../src/store/useProgressStore';
import { useTheme } from '../../src/store/useTheme';
import { useScreenPadding } from '../../src/store/useScreenPadding';
import { Button } from '../../src/components/Button';
import { CalorieCalculator } from '../../src/components/CalorieCalculator';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { spacing, borderRadius, shadows, accentColors, ThemeType } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '../../src/context/AlertContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const { user } = useUserStore();
    const { user: authUser } = useAuthStore();
    const { logout } = useAuthStore();
    const { measurements, loadMeasurements, deleteMeasurement, addMeasurement } = useProgressStore();
    const { mode, setThemeMode, themeType, setThemeType, colors, initTheme } = useTheme();
    const { contentTop } = useScreenPadding();
    const { showAlert } = useAlert();

    const [showCalculator, setShowCalculator] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isLogging, setIsLogging] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [editingItem, setEditingItem] = useState<any | null>(null);

    useEffect(() => {
        initTheme();
        loadMeasurements();
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
            showAlert("Success", "Profile photo updated from Google account.");
        } else {
            showAlert("Error", "No Google profile picture found.");
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

        showAlert("Change Profile Photo", "Choose an option to update your profile picture.", options);
    };

    const handleLogout = async () => {
        showAlert(
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

            showAlert("Success", editingItem ? "Weight entry updated!" : "Weight logged successfully!");
        } catch (error) {
            showAlert("Error", "Failed to log weight. Please try again.");
        }
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteMeasurement(deleteId);
            setDeleteId(null);
        }
    };

    const latestWeight = measurements[0]?.weight || user?.weight || 0;
    const weightChange = measurements.length >= 2
        ? (measurements[0].weight - measurements[1].weight).toFixed(1)
        : 0;

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background.primary }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Dynamic Status Bar Spacer based on active workout */}
            <View style={{ height: contentTop }} />

            {/* Premium Header Profile Card */}
            <View style={styles.profileHeaderWrapper}>
                <LinearGradient
                    colors={[colors.accent.primary, colors.accent.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileHeaderCard}
                >
                    <>
                        <View style={styles.profileTopRow}>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileWelcome}>Welcome back,</Text>
                                <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                            </View>
                            <View>
                                <View style={styles.avatarMain}>
                                    {user?.picture ? (
                                        <Image source={{ uri: user.picture }} style={{ width: 68, height: 68, borderRadius: 34 }} />
                                    ) : (
                                        <Text style={[styles.avatarTextMain, { color: colors.accent.primary }]}>
                                            {user?.name?.charAt(0) || 'U'}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={{
                                        position: 'absolute',
                                        bottom: -2,
                                        right: -2,
                                        backgroundColor: colors.accent.primary,
                                        width: 28,
                                        height: 28,
                                        borderRadius: 14,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 2,
                                        borderColor: colors.accent.secondary
                                    }}
                                    onPress={handleAvatarPress}
                                >
                                    <Ionicons name="camera" size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.profileBadges}>
                            <View style={styles.profileBadgeItem}>
                                <Ionicons name="flame" size={14} color="white" />
                                <Text style={styles.profileBadgeText}>{user?.goal || 'Maintain'}</Text>
                            </View>
                            <View style={styles.profileBadgeItem}>
                                <Ionicons name="trending-up" size={14} color="white" />
                                <Text style={styles.profileBadgeText}>{user?.activityLevel?.replace('_', ' ') || 'Active'}</Text>
                            </View>
                        </View>
                    </>
                </LinearGradient>
            </View>

            <View style={styles.content}>
                {/* Section: Progress Summary */}
                <View style={styles.sectionHeaderNew}>
                    <Text style={[styles.sectionTitleNew, { color: colors.text.primary }]}>Body Stats</Text>
                    <TouchableOpacity onPress={() => setShowHistory(true)}>
                        <Text style={{ color: colors.accent.primary, fontWeight: '700', fontSize: 13 }}>View History</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.statsRowNew]}>
                    <View style={[styles.statBox, { backgroundColor: colors.background.card, borderColor: colors.border.secondary }]}>
                        <View style={[styles.statIconCircle, { backgroundColor: colors.accent.primary + '15' }]}>
                            <Ionicons name="scale-outline" size={20} color={colors.accent.primary} />
                        </View>
                        <Text style={[styles.statValueNew, { color: colors.text.primary }]}>{latestWeight}</Text>
                        <Text style={[styles.statLabelNew, { color: colors.text.tertiary }]}>Weight (kg)</Text>
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

                {/* Account Actions */}
                <View style={styles.actionRowNew}>
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
                    goal: user?.goal
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
                            });

                            // Reload user data to show updated values
                            await useUserStore.getState().loadUser();

                            showAlert('Success', 'Profile updated successfully!');
                        }
                    } catch (error) {
                        console.error('Failed to update profile:', error);
                        showAlert('Error', 'Failed to update profile. Please try again.');
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
        ...shadows.lg,
    },
    profileHeaderCard: {
        borderRadius: 32,
        padding: 24,
    },
    profileTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileInfo: {
        flex: 1,
    },
    profileWelcome: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    profileName: {
        color: 'white',
        fontSize: 28,
        fontWeight: '900',
        marginTop: 4,
    },
    avatarMain: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        overflow: 'hidden'
    },
    avatarTextMain: {
        fontSize: 28,
        fontWeight: '900',
    },
    profileBadges: {
        flexDirection: 'row',
        gap: 10,
    },
    profileBadgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    profileBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    content: {
        paddingTop: 32,
        paddingHorizontal: spacing.xl,
    },
    sectionHeaderNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
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