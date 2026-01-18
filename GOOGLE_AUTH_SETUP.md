# Google Authentication Setup Guide

This project is pre-configured to use **Google Sign-In** via `expo-auth-session`. Follow these steps to generate the necessary credentials and enable authentication.

## Prerequisites

-   A Google Cloud Platform (GCP) account.
-   The `scheme` in your `app.json` (currently set to `todo`).

## Step 1: Google Cloud Console Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** (e.g., "Gym App").
3.  Navigate to **APIs & Services > OAuth consent screen**.
    -   Select **External** (unless you are in an organization).
    -   Fill in the **App Name** (e.g., "Gym App"), **User Support Email**, and **Developer Contact Information**.
    -   Click **Save and Continue**.
    -   (Optional) Add specific scopes if needed (default `profile` and `email` are usually sufficient).
    -   **Test Users**: Add your own email address to test while in "Testing" mode.

## Step 2: Create Credentials

You need to create separate Client IDs for each platform you intend to support.

### 2.1 Web Client ID (Required for Expo Go & Web)

1.  Go to **APIs & Services > Credentials**.
2.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3.  Select **Web application**.
4.  Name it "Web Client".
5.  **Authorized JavaScript origins**:
    -   `https://auth.expo.io` (Recommended for Expo Go proxy)
    -   `http://localhost:8081` (For web development)
6.  **Authorized redirect URIs**:
    -   `https://auth.expo.io/@your-username/ToDo` (Replace `@your-username` with your Expo username and `ToDo` with the `slug` from `app.json`)
    -   `http://localhost:8081`
7.  Click **Create**.
8.  **Copy the Client ID** (ending in `.apps.googleusercontent.com`).

### 2.2 Android Client ID

1.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
2.  Select **Android**.
3.  Name it "Android Client".
4.  **Package name**: Use the package name from `app.json` (`android.package`).
    -   Current: `com.gymnative.app`
5.  **SHA-1 Certificate Fingerprint**:
    -   **For Development (Expo Go)**: You don't strictly need this if using the Web Client ID proxy, but for a standalone build, run `cd android && ./gradlew signingReport` to get your debug key SHA-1.
    -   **For Production**: Get the SHA-1 from your keystore or Play Console.
6.  Click **Create**.
7.  **Copy the Client ID**.

### 2.3 iOS Client ID

1.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
2.  Select **iOS**.
3.  Name it "iOS Client".
4.  **Bundle ID**: Use the bundle identifier (usually same as package name, not explicitly set in `app.json` currently, but likely `com.gymnative.app` or you can set it).
5.  Click **Create**.
6.  **Copy the Client ID**.

## Step 3: Configure the Application

1.  Open the file `src/services/authService.ts`.
2.  Replace the placeholder strings with your new Client IDs:

```typescript
// src/services/authService.ts

// Replace these values:
const GOOGLE_CLIENT_ID_WEB = 'YOUR_NEW_WEB_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_ANDROID = 'YOUR_NEW_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS = 'YOUR_NEW_IOS_CLIENT_ID.apps.googleusercontent.com';
```

## Step 4: Testing

1.  Restart your Expo server (`npx expo start -c`).
2.  **Android/iOS**: Tap "Sign in with Google". It should open a browser modal (using `expo-web-browser`) to authenticate.
3.  **Web**: It will use the popup flow.

## Troubleshooting

-   **Error 400: redirect_uri_mismatch**:
    -   Ensure `https://auth.expo.io/@your-username/ToDo` is added to **Authorized redirect URIs** in the Web Client ID settings.
    -   Ensure your `scheme` in `app.json` matches what the auth session expects.
-   **No modal opens**:
    -   Ensure `WebBrowser.maybeCompleteAuthSession()` is called (it is already in `authService.ts`).
