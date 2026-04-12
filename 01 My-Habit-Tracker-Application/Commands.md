npm install -g expo-cli
npx create-expo-app my-habit-tracker
cd my-habit-tracker

npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-community/datetimepicker
npx expo install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

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

npx expo start

===================================================================

# 1. Remove the old broken global expo-cli (run from anywhere)
npm uninstall -g expo-cli

# 2. Navigate INTO the project (note the quotes — needed for the space in folder name)
cd "E:\Git\React_Native___Projects\01 My-Habit-Tracker-Application"

# 3. Confirm you're in the right place (should show package.json)
dir package.json

# 4. Install web dependencies
npx expo install react-dom react-native-web @expo/metro-runtime

# 5. Fix version mismatches
npx expo install --fix

# 6. Start in browser
npx expo start --web