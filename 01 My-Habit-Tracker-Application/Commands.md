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
