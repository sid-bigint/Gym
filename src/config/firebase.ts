import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { initializeAuth, getAuth, Auth, Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

type ReactNativePersistenceFactory = (storage: typeof AsyncStorage) => Persistence;

const firebaseConfig = {
    apiKey: "AIzaSyDCEWAnFKmJ-p7iLn3nyUjnHDZcKwV4qa4",
    authDomain: "my-gym-native.firebaseapp.com",
    databaseURL: "https://my-gym-native-default-rtdb.firebaseio.com",
    projectId: "my-gym-native",
    storageBucket: "my-gym-native.firebasestorage.app",
    messagingSenderId: "1082475202315",
    appId: "1:1082475202315:web:48977750e3e97b0dc8840e",
    measurementId: "G-V0D7JGE97R"
};

// Initialize Firebase (Singleton)
let app: FirebaseApp;
let auth: Auth;
let rtdb: Database;
let analytics: Analytics | undefined;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);

    // Prefer React Native persistence when the installed Firebase bundle exposes it.
    const authModule = require('firebase/auth') as {
        getReactNativePersistence?: ReactNativePersistenceFactory;
    };

    if (authModule.getReactNativePersistence) {
        auth = initializeAuth(app, {
            persistence: authModule.getReactNativePersistence(AsyncStorage)
        });
    } else {
        auth = getAuth(app);
    }

    // Initialize Realtime Database
    rtdb = getDatabase(app);

    // Initialize Analytics (ensure compatibility)
    isSupported().then(yes => {
        if (yes) {
            analytics = getAnalytics(app);
        }
    }).catch(() => { });

} else {
    app = getApp();
    auth = getAuth(app);
    rtdb = getDatabase(app);
}

export { app, auth, rtdb, analytics };
