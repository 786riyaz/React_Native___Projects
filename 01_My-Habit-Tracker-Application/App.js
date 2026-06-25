import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppProvider, useApp } from "./config/AppContext";
import DashboardScreen from "./screens/DashboardScreen";
import MonthViewScreen from "./screens/MonthViewScreen";
import SetupScreen from "./screens/SetupScreen";
import TodoScreen from "./screens/TodoScreen";
import TrackerScreen from "./screens/TrackerScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Tracker: "📅",
  ToDo: "📝",
  Dashboard: "📊",
  "Month View": "📆",
  Setup: "⚙️",
};

function AppShell() {
  const { themeObj, toggleTheme } = useApp();
  const t = themeObj;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar
        barStyle={t.name === "light" ? "dark-content" : "light-content"}
        backgroundColor={t.bg}
      />
      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: t.bg, borderBottomColor: t.border },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: t.accentLight }]}>
            Activity Tracker
          </Text>
          <Text style={[styles.headerSub, { color: t.textLight }]}>
            Track your daily & weekly habits
          </Text>
        </View>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeBtn, { borderColor: t.border }]}
        >
          <Text style={{ color: t.text, fontSize: 12 }}>{t.label}</Text>
        </TouchableOpacity>
      </View>

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: t.navBg,
            borderTopColor: t.border,
            borderTopWidth: 1,
            paddingBottom: 6,
            paddingTop: 6,
            height: 62,
          },
          tabBarActiveTintColor: t.navActiveText,
          tabBarInactiveTintColor: t.textLight,
          tabBarActiveBackgroundColor: "transparent",
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                color,
                fontSize: 10,
                fontWeight: focused ? "700" : "400",
              }}
            >
              {route.name}
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>
              {TAB_ICONS[route.name]}
            </Text>
          ),
          tabBarItemStyle: {
            borderRadius: 10,
            marginHorizontal: 2,
            backgroundColor: "transparent",
          },
        })}
      >
        <Tab.Screen name="Tracker" component={TrackerScreen} />
        <Tab.Screen name="ToDo" component={TodoScreen} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Month View" component={MonthViewScreen} />
        <Tab.Screen name="Setup" component={SetupScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <AppShell />
      </NavigationContainer>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
