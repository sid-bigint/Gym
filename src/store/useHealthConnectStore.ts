import { create } from 'zustand';
import { Platform, Linking } from 'react-native';
import { endOfDay, startOfDay } from 'date-fns';
import {
    SdkAvailabilityStatus,
    getGrantedPermissions,
    getSdkStatus,
    initialize,
    openHealthConnectDataManagement,
    openHealthConnectSettings,
    readRecords,
    requestPermission,
} from 'react-native-health-connect';

const REQUIRED_PERMISSIONS = [
    { accessType: 'read' as const, recordType: 'Steps' as const },
];

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';

interface HealthConnectState {
    sdkStatus: number | null;
    isAvailable: boolean;
    isInitialized: boolean;
    hasStepPermission: boolean;
    todaySteps: number;
    lastSyncedAt: string | null;
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    bootstrap: () => Promise<void>;
    refreshStatus: () => Promise<void>;
    connectAndSync: () => Promise<void>;
    syncTodaySteps: () => Promise<void>;
    openPermissionsScreen: () => void;
    openHealthConnectApp: () => Promise<void>;
}

function isAndroid() {
    return Platform.OS === 'android';
}

function hasRequiredStepPermission(grantedPermissions: { accessType: string; recordType: string }[]) {
    return REQUIRED_PERMISSIONS.every((required) =>
        grantedPermissions.some(
            (granted) =>
                granted.accessType === required.accessType &&
                granted.recordType === required.recordType
        )
    );
}

export const useHealthConnectStore = create<HealthConnectState>((set, get) => ({
    sdkStatus: null,
    isAvailable: false,
    isInitialized: false,
    hasStepPermission: false,
    todaySteps: 0,
    lastSyncedAt: null,
    isLoading: false,
    isSyncing: false,
    error: null,

    refreshStatus: async () => {
        if (!isAndroid()) {
            set({
                sdkStatus: null,
                isAvailable: false,
                isInitialized: false,
                hasStepPermission: false,
                todaySteps: 0,
                error: 'Health Connect is available only on Android.',
            });
            return;
        }

        try {
            const sdkStatus = await getSdkStatus();
            const isAvailable = sdkStatus === SdkAvailabilityStatus.SDK_AVAILABLE;

            set({
                sdkStatus,
                isAvailable,
                error: isAvailable ? null : 'Health Connect is not available on this device yet.',
            });
        } catch (error) {
            console.error('Failed to refresh Health Connect status', error);
            set({
                sdkStatus: null,
                isAvailable: false,
                error: 'Could not check Health Connect availability.',
            });
        }
    },

    bootstrap: async () => {
        set({ isLoading: true, error: null });
        try {
            await get().refreshStatus();

            if (!get().isAvailable) {
                return;
            }

            const initialized = await initialize();
            const grantedPermissions = await getGrantedPermissions();
            const hasStepPermission = hasRequiredStepPermission(grantedPermissions);

            set({
                isInitialized: initialized,
                hasStepPermission,
                error: null,
            });

            if (initialized && hasStepPermission) {
                await get().syncTodaySteps();
            }
        } catch (error) {
            console.error('Failed to bootstrap Health Connect', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to connect to Health Connect.',
            });
        } finally {
            set({ isLoading: false });
        }
    },

    connectAndSync: async () => {
        if (!isAndroid()) {
            set({ error: 'Health Connect is available only on Android.' });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            await get().refreshStatus();
            const currentStatus = get().sdkStatus;

            if (currentStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
                set({
                    error: currentStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
                        ? 'Install or update Health Connect to continue.'
                        : 'Health Connect is not available on this device.',
                });
                return;
            }

            const initialized = await initialize();
            const grantedPermissions = await requestPermission(REQUIRED_PERMISSIONS);
            const hasStepPermission = hasRequiredStepPermission(grantedPermissions);

            set({
                isInitialized: initialized,
                hasStepPermission,
                error: hasStepPermission ? null : 'Step access was not granted.',
            });

            if (initialized && hasStepPermission) {
                await get().syncTodaySteps();
            }
        } catch (error) {
            console.error('Failed to connect Health Connect', error);
            set({
                error: error instanceof Error ? error.message : 'Health Connect connection failed.',
            });
        } finally {
            set({ isLoading: false });
        }
    },

    syncTodaySteps: async () => {
        if (!get().isInitialized || !get().hasStepPermission) {
            return;
        }

        set({ isSyncing: true, error: null });
        try {
            const now = new Date();
            const result = await readRecords('Steps', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: startOfDay(now).toISOString(),
                    endTime: endOfDay(now).toISOString(),
                },
            });

            const todaySteps = result.records.reduce((total, record) => total + (record.count || 0), 0);

            set({
                todaySteps,
                lastSyncedAt: new Date().toISOString(),
                error: null,
            });
        } catch (error) {
            console.error('Failed to sync today steps', error);
            set({
                error: error instanceof Error ? error.message : 'Could not sync step data.',
            });
        } finally {
            set({ isSyncing: false });
        }
    },

    openPermissionsScreen: () => {
        try {
            openHealthConnectDataManagement();
        } catch (error) {
            console.error('Failed to open Health Connect data management', error);
        }
    },

    openHealthConnectApp: async () => {
        if (!isAndroid()) {
            return;
        }

        try {
            openHealthConnectSettings();
        } catch (error) {
            console.warn('Falling back to Play Store for Health Connect', error);
            const marketUrl = `market://details?id=${HEALTH_CONNECT_PACKAGE}`;
            const webUrl = `https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`;

            const canOpenMarket = await Linking.canOpenURL(marketUrl);
            if (canOpenMarket) {
                await Linking.openURL(marketUrl);
            } else {
                await Linking.openURL(webUrl);
            }
        }
    },
}));
