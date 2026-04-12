# 📱 How to Build APK — My Habit Tracker

## Overview

There are two ways to build an APK:

1. **EAS Build (Cloud)** — Easiest, no Android Studio needed ✅ Recommended
2. **Local Build** — Needs Android Studio + Java installed

---

## Method 1 — EAS Cloud Build (Recommended)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to your Expo account

```bash
eas login
```

> Don't have an account? Create one free at https://expo.dev

### Step 3: Configure your project

```bash
eas build:configure
```

This will create/update `eas.json` automatically.

### Step 4: Update app.json

Make sure your `app.json` has an `android.package` field (already done in the fixed file):

```json
"android": {
  "package": "com.yourname.myhabittracker",
  "versionCode": 1
}
```

> Change `yourname` to something unique — e.g. `com.rahul.myhabittracker`

### Step 5: Build the APK

```bash
eas build --platform android --profile preview
```

- This builds an **APK** (installable directly on your phone)
- Build runs on Expo's cloud servers (~10-15 minutes)
- You'll get a download link when done

### Step 6: Install on your phone

- Download the `.apk` file from the link
- On your Android phone: Settings → Security → Allow "Install unknown apps"
- Open the downloaded APK and install

---

## Method 2 — Local Build (Needs Android Studio)

### Prerequisites

- Android Studio installed
- Java JDK 17 installed
- `ANDROID_HOME` environment variable set

### Steps

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Run prebuild (generates android/ folder)
npx expo prebuild --platform android

# Build debug APK
cd android
./gradlew assembleDebug

# APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Code Fixes Applied (Required Before Building)

### Fix 1 — TrackerScreen.js

**Problem:** `ActivityRow` component was defined _inside_ `TrackerScreen`.
React treats it as a new component type every render, causing:

- Flickering on Android
- Lost focus states
- Performance issues
  **Fix:** Moved `ActivityRow` _outside_ the parent component. ✅

### Fix 2 — DateTimePicker (Android)

**Problem:** `setShowDatePicker(Platform.OS === "ios")` — this leaves the
picker open on Android after selection.
**Fix:** Always hide on Android, handle `dismissed` event. ✅

### Fix 3 — app.json

**Problem:** Missing `android.package` — required for any APK build.
**Fix:** Added `"package": "com.yourname.myhabittracker"` ✅

> ⚠️ Change `yourname` to your own name before building!

### Fix 4 — eas.json

**Problem:** File was empty in the project.
**Fix:** Proper EAS build profiles added with `"buildType": "apk"` for preview. ✅

---

## Common Errors & Fixes

| Error                       | Fix                                        |
| --------------------------- | ------------------------------------------ |
| `Missing android.package`   | Add package name to app.json               |
| `eas: command not found`    | Run `npm install -g eas-cli`               |
| `Not logged in`             | Run `eas login`                            |
| `Build failed: SDK version` | Run `npx expo install --fix`               |
| APK installs but crashes    | Check `npx expo start` for JS errors first |

---

## File Checklist Before Building

Make sure these files exist in your project root:

- [x] `App.js`
- [x] `app.json` (with android.package)
- [x] `eas.json`
- [x] `babel.config.js`
- [x] `config/AppContext.js`
- [x] `config/activityConfig.js`
- [x] `config/theme.js`
- [x] `screens/TrackerScreen.js` (fixed version)
- [x] `screens/DashboardScreen.js`
- [x] `screens/MonthViewScreen.js`
- [x] `screens/SetupScreen.js`
- [x] `screens/TodoScreen.js`
- [x] `components/CategoryPill.js`
- [x] `utils/confirm.js`
- [x] `assets/icon.png` (1024x1024)
- [x] `assets/adaptive-icon.png` (1024x1024)
- [x] `assets/splash.png` (any size)
