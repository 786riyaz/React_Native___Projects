// screens/TrackerScreen.js
// ✅ Platform-safe: DateTimePicker import is guarded so web bundle doesn't crash
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import CategoryPill from "../components/CategoryPill";
import { useApp } from "../config/AppContext";
import { getDailyMeta, getWeeklyMeta } from "../config/activityConfig";

// ✅ FIX: Lazy-import DateTimePicker only on native platforms.
// On web the package doesn't exist and crashes the bundler.
let DateTimePicker = null;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

// ✅ ActivityRow defined OUTSIDE parent — avoids remount on every render
function ActivityRow({ name, done, meta, onToggle, t }) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.checkRow,
        {
          backgroundColor: done
            ? "rgba(129,140,248,0.18)"
            : t.checkRowBg,
          borderColor: done ? t.accent : t.checkRowBorder,
          borderLeftColor: done ? t.accent : "transparent",
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {/* Checkbox */}
      <View
        style={[
          styles.checkbox,
          {
            borderColor: done ? t.accent : t.border,
            backgroundColor: done ? t.accent : "transparent",
          },
        ]}
      >
        {done && <Text style={styles.checkMark}>✓</Text>}
      </View>

      {/* Name */}
      <Text
        style={[
          styles.activityName,
          { color: done ? t.accentLight : t.text },
          done && { textDecorationLine: "line-through", opacity: 0.7 },
        ]}
        numberOfLines={2}
      >
        {name}
      </Text>

      {/* Right: category + time */}
      <View style={styles.checkRight}>
        <CategoryPill category={meta.category} />
        {meta.timeLabel ? (
          <View style={[styles.timePill, { backgroundColor: t.timePillBg }]}>
            <Text style={[styles.timePillText, { color: t.timePillText }]}>
              {meta.timeLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function TrackerScreen() {
  const {
    activities,
    history,
    currentDate,
    setCurrentDate,
    updateDayStatus,
    customMeta,
    themeObj,
  } = useApp();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const t = themeObj;

  const date = new Date(currentDate + "T12:00:00");
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const daily = history[currentDate]?.daily || {};
  const weekly = history[currentDate]?.weekly || {};

  const goPrev = () => {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toLocaleDateString("en-CA"));
  };

  const goNext = () => {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toLocaleDateString("en-CA"));
  };

  const goToday = () =>
    setCurrentDate(new Date().toLocaleDateString("en-CA"));

  const todaysWeekly = activities.weekly.filter((w) =>
    w.days.includes(dayName),
  );
  const dailyDoneCount = activities.daily.filter((n) => daily[n]).length;
  const weeklyDoneCount = todaysWeekly.filter((w) => weekly[w.name]).length;
  const dailyTotal = activities.daily.length;
  const dailyPercent =
    dailyTotal > 0 ? (dailyDoneCount / dailyTotal) * 100 : 0;
  const allDone = dailyTotal > 0 && dailyDoneCount === dailyTotal;
  const isToday =
    currentDate === new Date().toLocaleDateString("en-CA");

  const formatDisplay = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "dismissed") { setShowDatePicker(false); return; }
    if (selectedDate) setCurrentDate(selectedDate.toLocaleDateString("en-CA"));
    if (Platform.OS === "ios") setShowDatePicker(false);
  };

  // ✅ Web fallback: browser date input when DateTimePicker unavailable
  const handleDateButtonPress = () => {
    if (Platform.OS === "web") {
      // On web, use a hidden HTML date input
      const input = document.createElement("input");
      input.type = "date";
      input.value = currentDate;
      input.style.position = "absolute";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.focus();
      input.click();
      input.addEventListener("change", (e) => {
        if (e.target.value) setCurrentDate(e.target.value);
        document.body.removeChild(input);
      });
      input.addEventListener("blur", () => {
        setTimeout(() => {
          if (document.body.contains(input)) document.body.removeChild(input);
        }, 200);
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const handleToggle = (type, name, currentDone) => {
    if (Platform.OS !== "web") Vibration.vibrate(30);
    updateDayStatus(type, name, !currentDone);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* DATE CARD */}
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
        <Text style={[styles.cardTitle, { color: t.accentLight }]}>Tracker</Text>

        <View style={styles.dateRow}>
          <TouchableOpacity
            onPress={goPrev}
            style={[styles.navBtn, { borderColor: t.border }]}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: t.text, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>

          <View style={styles.dateCenter}>
            {/* Date display / picker trigger */}
            <TouchableOpacity
              onPress={handleDateButtonPress}
              style={[
                styles.dateDisplay,
                {
                  borderColor: isToday ? t.accent : t.border,
                  backgroundColor: t.inputBg,
                  borderWidth: isToday ? 2 : 1,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.dateText, { color: t.inputText }]}>
                {formatDisplay(currentDate)}
              </Text>
              {isToday && (
                <View style={[styles.todayDot, { backgroundColor: t.accent }]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToday}
              style={[styles.todayBtn, { opacity: isToday ? 0.45 : 1 }]}
              disabled={isToday}
              activeOpacity={0.7}
            >
              <Text style={styles.todayBtnText}>⬤ Today</Text>
            </TouchableOpacity>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statChip, { borderColor: t.border, backgroundColor: t.pillBg }]}>
                <Text style={[styles.statText, { color: t.pillText }]}>
                  Daily {dailyDoneCount}/{dailyTotal}
                </Text>
              </View>
              <View style={[styles.statChip, { borderColor: t.border, backgroundColor: t.pillBg }]}>
                <Text style={[styles.statText, { color: t.pillText }]}>
                  Weekly {weeklyDoneCount}/{todaysWeekly.length}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            {dailyTotal > 0 && (
              <View style={[styles.progressBg, { backgroundColor: t.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${dailyPercent}%`,
                      backgroundColor: allDone ? "#16a34a" : t.accent,
                    },
                  ]}
                />
              </View>
            )}
            {allDone && (
              <Text style={styles.allDoneText}>🎉 All daily tasks done!</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={goNext}
            style={[styles.navBtn, { borderColor: t.border }]}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: t.text, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Native date picker — only rendered on native, never on web */}
        {showDatePicker && DateTimePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
          />
        )}
      </View>

      {/* DAILY */}
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
        <View style={[styles.sectionHeaderRow, { borderBottomColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Daily Activities</Text>
          <Text style={[styles.sectionCount, { color: allDone ? "#16a34a" : t.textLight }]}>
            {dailyDoneCount}/{dailyTotal}{allDone ? " ✓" : ""}
          </Text>
        </View>
        {activities.daily.length === 0 && (
          <Text style={[styles.emptyMsg, { color: t.textLight }]}>
            No daily activities. Add some in Setup.
          </Text>
        )}
        {activities.daily.map((name) => {
          const done = !!daily[name];
          const meta = getDailyMeta(name, customMeta);
          return (
            <ActivityRow
              key={name}
              name={name}
              done={done}
              meta={meta}
              t={t}
              onToggle={() => handleToggle("daily", name, done)}
            />
          );
        })}
      </View>

      {/* WEEKLY */}
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
        <View style={[styles.sectionHeaderRow, { borderBottomColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>
            Weekly — {dayName}
          </Text>
          <Text style={[styles.sectionCount, { color: t.textLight }]}>
            {weeklyDoneCount}/{todaysWeekly.length}
          </Text>
        </View>
        {todaysWeekly.length === 0 ? (
          <View style={styles.emptyWeekly}>
            <Text style={{ fontSize: 32 }}>🗓</Text>
            <Text style={[styles.emptyMsg, { color: t.textLight }]}>
              No weekly tasks for {dayName}.
            </Text>
          </View>
        ) : (
          todaysWeekly.map((w) => {
            const done = !!weekly[w.name];
            const meta = getWeeklyMeta(w.name);
            return (
              <ActivityRow
                key={w.name}
                name={w.name}
                done={done}
                meta={meta}
                t={t}
                onToggle={() => handleToggle("weekly", w.name, done)}
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 50, gap: 12 },

  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", marginBottom: 14, letterSpacing: -0.5 },

  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  navBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  dateCenter: { flex: 1, alignItems: "center", gap: 8 },
  dateDisplay: {
    width: "100%", borderRadius: 14,
    paddingVertical: 11, paddingHorizontal: 14,
    alignItems: "center", flexDirection: "row",
    justifyContent: "center", gap: 8,
  },
  dateText: { fontSize: 13, fontWeight: "700" },
  todayDot: { width: 7, height: 7, borderRadius: 4 },
  todayBtn: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 20, paddingVertical: 7, borderRadius: 999,
  },
  todayBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 8 },
  statChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  statText: { fontSize: 11, fontWeight: "600" },
  progressBg: { height: 6, borderRadius: 999, width: "100%", overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 999 },
  allDoneText: { fontSize: 13, fontWeight: "700", color: "#16a34a", textAlign: "center" },

  sectionHeaderRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingBottom: 12, marginBottom: 10, borderBottomWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionCount: { fontSize: 13, fontWeight: "600" },
  emptyMsg: { fontSize: 13, textAlign: "center", paddingVertical: 8 },
  emptyWeekly: { alignItems: "center", paddingVertical: 20, gap: 8 },

  checkRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, padding: 13, marginBottom: 7,
    borderWidth: 1, borderLeftWidth: 4, gap: 12,
  },
  checkbox: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 2,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  checkMark: { color: "#fff", fontSize: 14, fontWeight: "900" },
  activityName: { flex: 1, fontSize: 14, fontWeight: "500", lineHeight: 20 },
  checkRight: { alignItems: "flex-end", gap: 5, flexShrink: 0 },
  timePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  timePillText: { fontSize: 10, fontWeight: "600" },
});