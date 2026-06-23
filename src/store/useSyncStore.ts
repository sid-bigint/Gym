import { create } from 'zustand';

interface SyncState {
    isSyncing: boolean;
    lastSyncedAt: string | null;
    hasPendingChanges: boolean;
}

export const useSyncStore = create<SyncState>(() => ({
    isSyncing: false,
    lastSyncedAt: null,
    hasPendingChanges: false,
}));
