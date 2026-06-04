// config/AppContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_DAILY_NAMES, DEFAULT_WEEKLY_ITEMS } from "./activityConfig";
import { API_BASE } from "./api";
import { THEMES, THEME_ORDER } from "./theme";

const AppContext = createContext(null);

const apiFetch = (path) =>
  fetch(`${API_BASE}${path}`)
    .then((r) => r.json())
    .catch(() => null);

const apiPost = (path, body) =>
  fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then((r) => r.json())
    .catch(() => null);

export function AppProvider({ children }) {
  const [activities, setActivitiesState] = useState({ daily: [], weekly: [] });
  const [history, setHistoryState] = useState({});
  const [customMeta, setCustomMetaState] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [theme, setTheme] = useState("purple");
  const [initialized, setInitialized] = useState(false);
  const apiOk = useRef(false);

  // LOAD
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (["light", "dark", "purple"].includes(savedTheme)) setTheme(savedTheme);

        const [apiAct, apiMeta, apiHist] = await Promise.all([apiFetch("/api/activities"), apiFetch("/api/activities/meta"), apiFetch("/api/history")]);

        if (apiAct && !apiAct.error) {
          apiOk.current = true;
          setActivitiesState({ daily: apiAct.daily || [], weekly: apiAct.weekly || [] });
          setCustomMetaState(apiMeta && !apiMeta.error ? apiMeta : {});
          setHistoryState(apiHist && !apiHist.error ? apiHist : {});
        } else {
          const [sAct, sHist, sMeta] = await Promise.all([AsyncStorage.getItem("activities"), AsyncStorage.getItem("activity_history"), AsyncStorage.getItem("activity_meta")]);
          setActivitiesState(sAct ? JSON.parse(sAct) : { daily: [...DEFAULT_DAILY_NAMES], weekly: [...DEFAULT_WEEKLY_ITEMS] });
          setHistoryState(sHist ? JSON.parse(sHist) : {});
          setCustomMetaState(sMeta ? JSON.parse(sMeta) : {});
        }
      } catch (e) {
        console.error("Load error", e);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  const setActivities = async (next) => {
    const value = typeof next === "function" ? next(activities) : next;
    setActivitiesState(value);
    if (apiOk.current) apiPost("/api/activities", value);
    AsyncStorage.setItem("activities", JSON.stringify(value)).catch(console.error);
  };

  const setCustomMeta = async (next) => {
    const value = typeof next === "function" ? next(customMeta) : next;
    setCustomMetaState(value);
    if (apiOk.current) apiPost("/api/activities/meta", value);
    AsyncStorage.setItem("activity_meta", JSON.stringify(value)).catch(console.error);
  };

  const updateDayStatus = (type, name, value) => {
    setHistoryState((prev) => {
      const old = prev[currentDate] || { daily: {}, weekly: {} };
      const updated = { daily: { ...old.daily }, weekly: { ...old.weekly } };
      if (type === "daily") updated.daily[name] = value;
      if (type === "weekly") updated.weekly[name] = value;
      const next = { ...prev, [currentDate]: updated };
      AsyncStorage.setItem("activity_history", JSON.stringify(next)).catch(console.error);
      return next;
    });
    if (apiOk.current) apiPost("/api/history", { date: currentDate, type, name, value });
  };

  const toggleTheme = () => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
    setTheme(next);
    AsyncStorage.setItem("theme", next).catch(console.error);
  };

  return (
    <AppContext.Provider
      value={{
        activities,
        setActivities,
        history,
        setHistory: setHistoryState,
        currentDate,
        setCurrentDate,
        theme,
        toggleTheme,
        themeObj: THEMES[theme] || THEMES.purple,
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
