import { create } from 'zustand';

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

export const useHealthConnectStore = create<HealthConnectState>((set) => ({
    sdkStatus: null,
    isAvailable: false,
    isInitialized: false,
    hasStepPermission: false,
    todaySteps: 0,
    lastSyncedAt: null,
    isLoading: false,
    isSyncing: false,
    error: 'Health Connect feature is temporarily disabled pending Play Store compliance.',

    bootstrap: async () => {},
    refreshStatus: async () => {},
    connectAndSync: async () => {},
    syncTodaySteps: async () => {},
    openPermissionsScreen: () => {},
    openHealthConnectApp: async () => {},
}));
