import { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import CategoryPill from "../components/CategoryPill";
import { useApp } from "../config/AppContext";
import { getDailyMeta, getWeeklyMeta } from "../config/activityConfig";

export default function MonthViewScreen() {
  const { activities, history, customMeta, themeObj } = useApp();
  const t = themeObj;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = useMemo(() => {
    const totalDays = new Date(year, month, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      return {
        key: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        label: String(day).padStart(2, "0"),
      };
    });
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const getValue = (date, activity) => {
    const entry = history[date];
    if (!entry) return null;
    if (activity.type === "daily") return entry.daily?.[activity.name] ? 1 : 0;
    if (activity.type === "weekly")
      return entry.weekly?.[activity.name] ? 1 : 0;
    return null;
  };

  const dailyActivities = activities.daily.map((name) => ({
    type: "daily",
    name,
  }));
  const weeklyActivities = activities.weekly.map((w) => ({
    type: "weekly",
    name: w.name,
  }));

  const renderActivityRow = (act, type) => {
    const meta =
      type === "daily"
        ? getDailyMeta(act.name, customMeta)
        : getWeeklyMeta(act.name);
    return (
      <View
        key={act.name}
        style={[styles.actRow, { borderBottomColor: t.border }]}
      >
        <View style={styles.actNameCell}>
          <Text style={[styles.actName, { color: t.text }]} numberOfLines={2}>
            {act.name}
          </Text>
          <CategoryPill category={meta.category} />
          {meta.timeLabel ? (
            <Text style={[styles.timeLabel, { color: t.textLight }]}>
              {meta.timeLabel}
            </Text>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.cellsRow}>
            {daysInMonth.map((d) => {
              const v = getValue(d.key, act);
              return (
                <View key={d.key} style={styles.cell}>
                  <View
                    style={[
                      styles.cellBox,
                      v === 1
                        ? styles.cellDone
                        : v === 0
                          ? styles.cellMiss
                          : styles.cellEmpty,
                    ]}
                  />
                  <Text style={[styles.dayLabel, { color: t.textLight }]}>
                    {d.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: t.cardBg, borderColor: t.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: t.accentLight }]}>
          Month View
        </Text>

        {/* MONTH PICKER */}
        <View style={styles.monthPicker}>
          <TouchableOpacity
            onPress={prevMonth}
            style={[styles.monthBtn, { borderColor: t.border }]}
          >
            <Text style={{ color: t.text }}>◀</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: t.text }]}>
            {monthLabel}
          </Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={[styles.monthBtn, { borderColor: t.border }]}
          >
            <Text style={{ color: t.text }}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* LEGEND */}
        <View style={styles.legend}>
          <View style={[styles.cellBox, styles.cellDone, { marginRight: 4 }]} />
          <Text style={[styles.legendText, { color: t.textLight }]}>Done </Text>
          <View style={[styles.cellBox, styles.cellMiss, { marginRight: 4 }]} />
          <Text style={[styles.legendText, { color: t.textLight }]}>
            Missed{" "}
          </Text>
          <View
            style={[
              styles.cellBox,
              styles.cellEmpty,
              {
                borderWidth: 1,
                borderColor: "rgba(148,163,184,0.4)",
                marginRight: 4,
              },
            ]}
          />
          <Text style={[styles.legendText, { color: t.textLight }]}>
            No data
          </Text>
        </View>

        {/* DAILY */}
        <Text style={[styles.blockTitle, { color: t.accentLight }]}>
          Daily Activities
        </Text>
        {dailyActivities.length === 0 && (
          <Text style={{ color: t.textLight, fontSize: 12 }}>
            No daily activities.
          </Text>
        )}
        {dailyActivities.map((act) => renderActivityRow(act, "daily"))}

        {/* WEEKLY */}
        <Text
          style={[styles.blockTitle, { color: t.accentLight, marginTop: 16 }]}
        >
          Weekly Activities
        </Text>
        {weeklyActivities.length === 0 && (
          <Text style={{ color: t.textLight, fontSize: 12 }}>
            No weekly activities.
          </Text>
        )}
        {weeklyActivities.map((act) => renderActivityRow(act, "weekly"))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  monthPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { fontSize: 16, fontWeight: "600" },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  legendText: { fontSize: 11, marginRight: 8 },
  blockTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 4,
  },
  actRow: {
    borderBottomWidth: 0.5,
    paddingVertical: 8,
    gap: 6,
  },
  actNameCell: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  actName: { fontSize: 11, fontWeight: "500", flexShrink: 1 },
  timeLabel: { fontSize: 10 },
  cellsRow: { flexDirection: "row", gap: 3 },
  cell: { alignItems: "center", gap: 2 },
  dayLabel: { fontSize: 9 },
  cellBox: { width: 16, height: 16, borderRadius: 4 },
  cellDone: { backgroundColor: "#22c55e" },
  cellMiss: { backgroundColor: "#ef4444" },
  cellEmpty: { backgroundColor: "rgba(148,163,184,0.28)" },
});
