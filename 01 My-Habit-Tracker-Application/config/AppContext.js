import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_DAILY_NAMES, DEFAULT_WEEKLY_ITEMS } from "./activityConfig";
import { THEMES, THEME_ORDER } from "./theme";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activities, setActivities] = useState({ daily: [], weekly: [] });
  const [history, setHistory] = useState({});
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [theme, setTheme] = useState("purple");
  const [customMeta, setCustomMeta] = useState({});
  const [initialized, setInitialized] = useState(false);

  // LOAD
  useEffect(() => {
    const load = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (["light", "dark", "purple"].includes(savedTheme))
          setTheme(savedTheme);
        else setTheme("purple");

        const savedActivities = await AsyncStorage.getItem("activities");
        if (savedActivities) {
          const parsed = JSON.parse(savedActivities);
          if (!parsed.daily) parsed.daily = [];
          if (!parsed.weekly) parsed.weekly = [];
          setActivities(parsed);
        } else {
          setActivities({
            daily: [...DEFAULT_DAILY_NAMES],
            weekly: [...DEFAULT_WEEKLY_ITEMS],
          });
        }

        const savedHistory = await AsyncStorage.getItem("activity_history");
        setHistory(savedHistory ? JSON.parse(savedHistory) : {});

        const savedMeta = await AsyncStorage.getItem("activity_meta");
        setCustomMeta(savedMeta ? JSON.parse(savedMeta) : {});
      } catch (e) {
        console.error("Load error", e);
      } finally {
        setInitialized(true);
      }
    };
    load();
  }, []);

  // SAVE ACTIVITIES
  useEffect(() => {
    if (!initialized) return;
    AsyncStorage.setItem("activities", JSON.stringify(activities)).catch(
      console.error,
    );
  }, [activities, initialized]);

  // SAVE HISTORY
  useEffect(() => {
    if (!initialized) return;
    AsyncStorage.setItem("activity_history", JSON.stringify(history)).catch(
      console.error,
    );
  }, [history, initialized]);

  // SAVE META
  useEffect(() => {
    if (!initialized) return;
    AsyncStorage.setItem("activity_meta", JSON.stringify(customMeta)).catch(
      console.error,
    );
  }, [customMeta, initialized]);

  const updateDayStatus = (type, name, value) => {
    setHistory((prev) => {
      const old = prev[currentDate] || { daily: {}, weekly: {} };
      const updated = { daily: { ...old.daily }, weekly: { ...old.weekly } };
      if (type === "daily") updated.daily[name] = value;
      if (type === "weekly") updated.weekly[name] = value;
      return { ...prev, [currentDate]: updated };
    });
  };

  const toggleTheme = () => {
    const next =
      THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
    setTheme(next);
    AsyncStorage.setItem("theme", next).catch(console.error);
  };

  const themeObj = THEMES[theme] || THEMES.purple;

  return (
    <AppContext.Provider
      value={{
        activities,
        setActivities,
        history,
        setHistory,
        currentDate,
        setCurrentDate,
        theme,
        toggleTheme,
        themeObj,
        customMeta,
        setCustomMeta,
        updateDayStatus,
        initialized,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
