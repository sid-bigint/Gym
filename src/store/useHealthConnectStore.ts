import { create } from 'zustand';
import { Platform, Linking } from 'react-native';
import { endOfDay, startOfDay } from 'date-fns';

const REQUIRED_PERMISSIONS = [
    { accessType: 'read' as const, recordType: 'Steps' as const },
];

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';
const SDK_AVAILABLE = 3;

let healthConnectModule: any | null = null;
let healthConnectModuleChecked = false;

function getHealthConnectModule() {
    if (Platform.OS !== 'android') return null;
    if (healthConnectModule) return healthConnectModule;
    if (healthConnectModuleChecked) return null;

    try {
        healthConnectModuleChecked = true;
        healthConnectModule = require('react-native-health-connect');
        return healthConnectModule;
    } catch {
        return null;
    }
}

function isMissingNativeModuleError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("doesn't seem to be linked") ||
        message.includes('NativeModule') ||
        message.includes('TurboModuleRegistry');
}

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
        const mod = getHealthConnectModule();
        if (!mod) {
            set({
                sdkStatus: null,
                isAvailable: false,
                isInitialized: false,
                hasStepPermission: false,
                todaySteps: 0,
                error: Platform.OS === 'android'
                    ? 'Health Connect requires a development or production build.'
                    : 'Health Connect is available only on Android.',
            });
            return;
        }

        try {
            const sdkStatus = await mod.getSdkStatus();
            const availableStatus = mod.SdkAvailabilityStatus?.SDK_AVAILABLE ?? SDK_AVAILABLE;
            const isAvailable = sdkStatus === availableStatus;

            set({
                sdkStatus,
                isAvailable,
                error: isAvailable ? null : 'Health Connect is not available on this device yet.',
            });
        } catch (error) {
            if (!isMissingNativeModuleError(error)) {
                console.error('Failed to refresh Health Connect status', error);
            }
            set({
                sdkStatus: null,
                isAvailable: false,
                error: isMissingNativeModuleError(error)
                    ? 'Health Connect requires a development or production build.'
                    : 'Could not check Health Connect availability.',
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

            const mod = getHealthConnectModule();
            if (!mod) return;

            const initialized = await mod.initialize();
            const grantedPermissions = await mod.getGrantedPermissions();
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
            if (!isMissingNativeModuleError(error)) {
                console.error('Failed to bootstrap Health Connect', error);
            }
            set({
                error: isMissingNativeModuleError(error)
                    ? 'Health Connect requires a development or production build.'
                    : error instanceof Error ? error.message : 'Failed to connect to Health Connect.',
            });
        } finally {
            set({ isLoading: false });
        }
    },

    connectAndSync: async () => {
        const mod = getHealthConnectModule();
        if (!mod) {
            set({ error: 'Health Connect requires a development or production Android build.' });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            await get().refreshStatus();
            const currentStatus = get().sdkStatus;
            const availableStatus = mod.SdkAvailabilityStatus?.SDK_AVAILABLE ?? SDK_AVAILABLE;
            const updateRequiredStatus = mod.SdkAvailabilityStatus?.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED;

            if (currentStatus !== availableStatus) {
                set({
                    error: currentStatus === updateRequiredStatus
                        ? 'Install or update Health Connect to continue.'
                        : 'Health Connect is not available on this device.',
                });
                return;
            }

            const initialized = await mod.initialize();
            const grantedPermissions = await mod.requestPermission(REQUIRED_PERMISSIONS);
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
            if (!isMissingNativeModuleError(error)) {
                console.error('Failed to connect Health Connect', error);
            }
            set({
                error: isMissingNativeModuleError(error)
                    ? 'Health Connect requires a development or production Android build.'
                    : error instanceof Error ? error.message : 'Health Connect connection failed.',
            });
        } finally {
            set({ isLoading: false });
        }
    },

    syncTodaySteps: async () => {
        if (!get().isInitialized || !get().hasStepPermission) {
            return;
        }

        const mod = getHealthConnectModule();
        if (!mod) return;

        set({ isSyncing: true, error: null });
        try {
            const now = new Date();
            const result = await mod.readRecords('Steps', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: startOfDay(now).toISOString(),
                    endTime: endOfDay(now).toISOString(),
                },
            });

            const todaySteps = result.records.reduce((total: number, record: any) => total + (record.count || 0), 0);

            set({
                todaySteps,
                lastSyncedAt: new Date().toISOString(),
                error: null,
            });
        } catch (error) {
            if (!isMissingNativeModuleError(error)) {
                console.error('Failed to sync today steps', error);
            }
            set({
                error: isMissingNativeModuleError(error)
                    ? 'Health Connect requires a development or production build.'
                    : error instanceof Error ? error.message : 'Could not sync step data.',
            });
        } finally {
            set({ isSyncing: false });
        }
    },

    openPermissionsScreen: () => {
        const mod = getHealthConnectModule();
        if (!mod) return;

        try {
            mod.openHealthConnectDataManagement();
        } catch (error) {
            console.error('Failed to open Health Connect data management', error);
        }
    },

    openHealthConnectApp: async () => {
        if (Platform.OS !== 'android') {
            return;
        }

        const mod = getHealthConnectModule();
        try {
            if (mod?.openHealthConnectSettings) {
                mod.openHealthConnectSettings();
                return;
            }
        } catch (error) {
            console.warn('Falling back to Play Store for Health Connect', error);
        }

        const marketUrl = `market://details?id=${HEALTH_CONNECT_PACKAGE}`;
        const webUrl = `https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`;

        const canOpenMarket = await Linking.canOpenURL(marketUrl);
        if (canOpenMarket) {
            await Linking.openURL(marketUrl);
        } else {
            await Linking.openURL(webUrl);
        }
    },
}));
