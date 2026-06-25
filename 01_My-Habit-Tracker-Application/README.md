# My Habit Tracker — React Native (Expo)

Complete React Native port of your Personal Activity Tracker web app.

## Features ✅

- **Tracker** — Daily & weekly checkbox tracking with date navigation
- **ToDo** — Categorized task manager (Learning, Notes, Doubt, Work, Personal)
- **Dashboard** — History browser with per-day done/missed breakdown
- **Month View** — Visual calendar grid (green = done, red = missed)
- **Setup** — Add/edit/delete daily & weekly activities with category & time
- **3 Themes** — Light ☀, Dark 🌙, Purple 💜 (persisted across launches)
- **AsyncStorage** — All data persists on device between app restarts

---

## Setup Instructions

### Step 1 — Copy files into your existing Expo project

You already ran:

```bash
npm install -g expo-cli
npx create-expo-app my-habit-tracker
cd my-habit-tracker
```

Now **replace** the contents of your `my-habit-tracker` folder with these files.  
Or copy them in manually (see structure below).

### Step 2 — Install dependencies

Inside your `my-habit-tracker` folder, run:

```bash
npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-community/datetimepicker
npx expo install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
```

### Step 3 — Replace App.js

Replace the default `App.js` with the one provided.

### Step 4 — Create the src folder structure

```
my-habit-tracker/
├── App.js                          ← Replace this
├── app.json
├── babel.config.js
├── package.json
└── src/
    ├── config/
    │   ├── activityConfig.js       ← All activity data & helpers
    │   ├── AppContext.js           ← Global state + AsyncStorage
    │   └── theme.js                ← 3 theme definitions
    ├── components/
    │   └── CategoryPill.js         ← Colored category badge
    └── screens/
        ├── TrackerScreen.js        ← Main tracker
        ├── DashboardScreen.js      ← History & stats
        ├── MonthViewScreen.js      ← Calendar grid
        ├── TodoScreen.js           ← ToDo list
        └── SetupScreen.js          ← Activity management
```

### Step 5 — Start the app

```bash
npx expo start
```

Then press:

- `a` for Android (emulator or device)
- `i` for iOS (simulator, macOS only)
- `w` for web browser

Or scan the QR code with **Expo Go** app on your phone.

---

## Key Differences from Web App

| Web (React)           | Mobile (React Native)           |
| --------------------- | ------------------------------- |
| `localStorage`        | `AsyncStorage`                  |
| `<div>` / `<span>`    | `<View>` / `<Text>`             |
| CSS classes           | `StyleSheet.create()`           |
| React Router          | React Navigation (Bottom Tabs)  |
| `<input type="date">` | `DateTimePicker` + touch button |
| `<input type="time">` | Plain text input (HH:MM)        |
| Export/Import JSON    | Not included (mobile storage)   |
| CSS themes on `body`  | Theme object passed via Context |

---

## Troubleshooting

**Metro bundler error on start:**

```bash
npx expo start --clear
```

**Package not found:**

```bash
npm install
```

**DateTimePicker not showing on Android:**  
Ensure you're using a real device or emulator, not Expo Web.

**AsyncStorage warning:**  
Make sure you ran `npx expo install @react-native-async-storage/async-storage` (not plain `npm install`).
