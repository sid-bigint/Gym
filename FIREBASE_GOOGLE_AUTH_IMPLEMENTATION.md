# Firebase Google Authentication Implementation Guide

## Overview
This guide will walk you through implementing Google Sign-In using Firebase Authentication in your Expo React Native app.

---

## Phase 1: Firebase Console Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `GymGuide360` (or your preferred name)
4. Enable/Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Add Android App to Firebase
1. In Firebase Console, click **"Add app"** → Select **Android**
2. Enter Android package name: `com.gymnative.app` (must match your `app.json`)
3. Enter app nickname: `Gym App`
4. **SHA-1 Certificate** (REQUIRED for Google Sign-In):
   - Open terminal in your project directory
   - Run: `cd android && ./gradlew signingReport`
   - Copy the **SHA-1** fingerprint from the debug variant
   - Paste it in Firebase Console
5. Click **"Register app"**
6. Download `google-services.json`
7. Place it in `android/app/` directory

### Step 3: Enable Google Sign-In Provider
1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google**
3. Toggle **Enable**
4. Select your **Support email**
5. Click **Save**

### Step 4: Get Web Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Credentials**
4. Find the **Web client** (auto created by Google Service)
5. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
6. Save this - you'll need it in your code

---

## Phase 2: Install Dependencies

### Step 1: Install Required Packages
```bash
# Install Firebase and Google Sign-In packages
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin

# OR if using Expo managed workflow, use expo-auth-session approach:
npx expo install expo-auth-session expo-crypto expo-web-browser
```

### Step 2: Configure app.json
Add the following to your `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./android/app/google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      ]
    ]
  }
}
```

---

## Phase 3: Code Implementation

### Step 1: Create Firebase Configuration
Create file: `src/config/firebase.ts`

```typescript
// Firebase configuration
export const FIREBASE_CONFIG = {
  WEB_CLIENT_ID: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  // Add other Firebase config if needed
};
```

### Step 2: Update Auth Store
Update `src/store/useAuthStore.ts`:

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { FIREBASE_CONFIG } from '../config/firebase';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
    provider: 'google' | 'email';
}

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    
    // Actions
    setUser: (user: AuthUser | null) => void;
    signInWithGoogle: () => Promise<boolean>;
    logout: () => Promise<void>;
    loadAuthState: () => Promise<void>;
    initializeGoogleSignIn: () => void;
}

const AUTH_STORAGE_KEY = '@gym_app_auth';

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    initializeGoogleSignIn: () => {
        GoogleSignin.configure({
            webClientId: FIREBASE_CONFIG.WEB_CLIENT_ID,
            offlineAccess: true,
        });
    },

    setUser: (user) => {
        set({ user, isAuthenticated: !!user });
    },

    signInWithGoogle: async () => {
        try {
            set({ isLoading: true });
            
            // Check if device supports Google Play Services
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            
            // Sign in with Google
            const { idToken } = await GoogleSignin.signIn();
            
            // Create a Google credential with the token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            
            // Sign-in to Firebase with the Google credentials
            const userCredential = await auth().signInWithCredential(googleCredential);
            const firebaseUser = userCredential.user;
            
            const authUser: AuthUser = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'User',
                picture: firebaseUser.photoURL || undefined,
                provider: 'google',
            };
            
            // Save to AsyncStorage
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
            
            set({ user: authUser, isAuthenticated: true, isLoading: false });
            return true;
            
        } catch (error: any) {
            set({ isLoading: false });
            
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('User cancelled the login flow');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                console.log('Sign in is in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                console.log('Play services not available');
            } else {
                console.error('Google Sign-In Error:', error);
            }
            return false;
        }
    },

    logout: async () => {
        try {
            // Sign out from Google
            await GoogleSignin.signOut();
            // Sign out from Firebase
            await auth().signOut();
            // Clear local storage
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            
            set({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    },

    loadAuthState: async () => {
        try {
            set({ isLoading: true });
            
            // Check Firebase auth state
            const currentUser = auth().currentUser;
            
            if (currentUser) {
                const authUser: AuthUser = {
                    id: currentUser.uid,
                    email: currentUser.email || '',
                    name: currentUser.displayName || 'User',
                    picture: currentUser.photoURL || undefined,
                    provider: 'google',
                };
                set({ user: authUser, isAuthenticated: true });
            } else {
                // Fallback to AsyncStorage
                const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
                if (stored) {
                    const user = JSON.parse(stored) as AuthUser;
                    set({ user, isAuthenticated: true });
                }
            }
        } catch (error) {
            console.error('Failed to load auth state:', error);
        } finally {
            set({ isLoading: false });
        }
    },
}));
```

### Step 3: Create Login Screen
Update `app/auth/login.tsx`:

```tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme } from '../../src/store/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { signInWithGoogle, isLoading, isAuthenticated, initializeGoogleSignIn } = useAuthStore();

    useEffect(() => {
        initializeGoogleSignIn();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/onboarding');
        }
    }, [isAuthenticated]);

    const handleGoogleSignIn = async () => {
        const success = await signInWithGoogle();
        if (success) {
            router.replace('/onboarding');
        }
    };

    return (
        <LinearGradient
            colors={[colors.background.primary, colors.background.secondary]}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Logo/Branding */}
                <View style={styles.logoContainer}>
                    <Ionicons name="fitness" size={80} color={colors.accent.primary} />
                    <Text style={[styles.title, { color: colors.text.primary }]}>
                        GymGuide360
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                        Your Personal Fitness Companion
                    </Text>
                </View>

                {/* Sign In Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.googleButton, { backgroundColor: '#FFFFFF' }]}
                        onPress={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#4285F4" />
                        ) : (
                            <>
                                <Image
                                    source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                                    style={styles.googleIcon}
                                />
                                <Text style={styles.googleButtonText}>
                                    Continue with Google
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Terms */}
                <Text style={[styles.terms, { color: colors.text.tertiary }]}>
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 8,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 24,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    terms: {
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});
```

### Step 4: Update Root Layout
Update `app/_layout.tsx` to initialize Google Sign-In:

```tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Alert } from "react-native";
import { initDatabase } from "../src/db/database";
import { useUserStore } from "../src/store/useUserStore";
import { useAuthStore } from "../src/store/useAuthStore";
import { AlertProvider } from "../src/context/AlertContext";
import { CustomAlert } from "../src/components/CustomAlert";

export default function RootLayout() {
  const loadUser = useUserStore((s) => s.loadUser);
  const { loadAuthState, initializeGoogleSignIn } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Starting...');

  useEffect(() => {
    async function init() {
      try {
        console.log('=== App Initialization Started ===');

        setLoadingStep('Initializing authentication...');
        initializeGoogleSignIn(); // Initialize Google Sign-In
        await loadAuthState();
        console.log('Auth state loaded');

        setLoadingStep('Initializing database...');
        await new Promise(r => setTimeout(r, 100));
        await initDatabase();
        console.log('Database initialized');

        setLoadingStep('Loading user profile...');
        await loadUser();
        console.log('User loaded');

        console.log('=== App Initialization Completed ===');
      } catch (e) {
        console.error("=== Initialization failed ===", e);
        Alert.alert('Initialization Error', 'Failed to start the app. Please restart.');
      } finally {
        setIsReady(true);
      }
    }
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>{loadingStep}</Text>
      </View>
    );
  }

  return (
    <AlertProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="programs" />
      </Stack>
      <CustomAlert />
    </AlertProvider>
  );
}
```

---

## Phase 4: Build Configuration

### Step 1: Create Development Build
Since Firebase requires native modules, you need to create a development build:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# Create development build for Android
eas build --profile development --platform android
```

### Step 2: Install Development Build
1. Once the build is complete, download the APK
2. Install it on your Android device
3. The development build will connect to your local Metro bundler

---

## Phase 5: Testing

### Step 1: Start Development Server
```bash
npx expo start --dev-client
```

### Step 2: Test Sign-In Flow
1. Open the development build on your device
2. Navigate to login screen
3. Tap "Continue with Google"
4. Select your Google account
5. You should be authenticated and redirected

---

## Troubleshooting

### Common Issues

1. **SHA-1 Mismatch Error**
   - Ensure the SHA-1 in Firebase matches your debug keystore
   - Run `cd android && ./gradlew signingReport` to get correct SHA-1

2. **Web Client ID Error**
   - Use the Web Client ID, not the Android Client ID
   - Find it in Google Cloud Console → Credentials

3. **Play Services Error**
   - Ensure Google Play Services is installed on the device
   - Update Play Services if needed

4. **Build Errors**
   - Clear cache: `npx expo start --clear`
   - Delete `node_modules` and reinstall

---

## File Structure After Implementation

```
Gym/
├── android/
│   └── app/
│       └── google-services.json  ← Firebase config
├── src/
│   ├── config/
│   │   └── firebase.ts          ← Firebase configuration
│   └── store/
│       └── useAuthStore.ts      ← Updated auth store
├── app/
│   ├── _layout.tsx              ← Updated with Google Sign-In init
│   ├── index.tsx                ← Entry point
│   └── auth/
│       └── login.tsx            ← Google Sign-In button
└── app.json                     ← Firebase plugins configured
```

---

## Next Steps After Implementation

1. **Add Loading States** - Show progress during authentication
2. **Error Handling** - Display user-friendly error messages
3. **Profile Sync** - Sync user profile with Firebase/database
4. **Offline Support** - Handle authentication when offline
5. **iOS Support** - Add iOS configuration if needed

---

## Summary of Steps

1. ✅ Create Firebase project
2. ✅ Add Android app with SHA-1
3. ✅ Enable Google Sign-In provider
4. ✅ Get Web Client ID
5. ✅ Install dependencies
6. ✅ Configure app.json
7. ✅ Create firebase config file
8. ✅ Update auth store
9. ✅ Create login screen
10. ✅ Update root layout
11. ✅ Create development build
12. ✅ Test on device

---

*Created: January 20, 2026*
