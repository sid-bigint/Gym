import { ref, set, get, child, update } from 'firebase/database';
import { rtdb, auth } from '../config/firebase';
import { UserProfile } from '../types';

export const CloudRepository = {
    // --- User Profile Sync ---

    /**
     * Pushes the local user profile to the cloud.
     * Call this whenever the user updates their profile locally.
     */
    async syncUserToCloud(user: UserProfile) {
        const currentUser = auth.currentUser;
        if (!currentUser) return; // Not logged in, skip sync

        try {
            const userRef = ref(rtdb, `users/${currentUser.uid}`);

            // Sanitize data -> Remove undefined values properly
            // Firebase doesn't like 'undefined', prefer 'null' or missing keys
            const cleanUser = JSON.parse(JSON.stringify(user));

            await set(userRef, {
                ...cleanUser,
                lastSyncedAt: new Date().toISOString()
            });
            console.log('✅ User synced to cloud');
        } catch (error) {
            console.error('❌ Cloud sync failed:', error);
            // TODO: queue for offline sync if needed
        }
    },

    /**
     * Fetches user profile from cloud.
     * Call this on login or app start.
     */
    async fetchUserFromCloud(): Promise<UserProfile | null> {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;

        try {
            const dbRef = ref(rtdb);
            const snapshot = await get(child(dbRef, `users/${currentUser.uid}`));

            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log('☁️ Fetched user from cloud');
                return data as UserProfile;
            } else {
                console.log('☁️ No cloud data found for this user');
                return null; // No cloud data yet
            }
        } catch (error) {
            console.error('❌ Cloud fetch failed:', error);
            return null;
        }
    },

    // --- Workouts Sync ---
    // We will likely implement this in Phase 4.1 for full workout history syncing
};
