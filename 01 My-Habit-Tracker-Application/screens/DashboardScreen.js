// screens/DashboardScreen.js
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CategoryPill from "../components/CategoryPill";
import { useApp } from "../config/AppContext";
import { getDailyMeta, getWeeklyMeta } from "../config/activityConfig";

export default function DashboardScreen() {
  const { activities, history, customMeta, themeObj } = useApp();
  const t = themeObj;
  const [selected, setSelected] = useState(null);

  const dates = Object.keys(history).sort((a, b) => b.localeCompare(a));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatsForDate = (date) => {
    const entry = history[date] || { daily: {}, weekly: {} };
    const dailyDone = activities.daily.filter((n) => entry.daily?.[n]).length;
    const weeklyDone = activities.weekly.filter(
      (w) => entry.weekly?.[w.name],
    ).length;
    const total = activities.daily.length + activities.weekly.length;
    const done = dailyDone + weeklyDone;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { dailyDone, weeklyDone, pct };
  };

  const progressPercent = useMemo(() => {
    if (!selected) return 0;
    return getStatsForDate(selected).pct;
  }, [selected, activities, history]);

  const selectedEntry = selected ? history[selected] || {} : {};
  const selectedDaily = selectedEntry.daily || {};
  const selectedWeekly = selectedEntry.weekly || {};

  // Color based on progress
  const progressColor =
    progressPercent === 100
      ? "#16a34a"
      : progressPercent >= 60
        ? t.accent
        : "#f59e0b";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: t.cardBg, borderColor: t.border },
        ]}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.cardTitle, { color: t.accentLight }]}>
              Dashboard
            </Text>
            {selected && (
              <Text style={[styles.headerSub, { color: t.textLight }]}>
                {formatDate(selected)}
              </Text>
            )}
          </View>

          {/* Progress ring */}
          <View style={[styles.ringOuter, { borderColor: progressColor }]}>
            <View style={[styles.ringInner, { backgroundColor: t.cardBg }]}>
              <Text style={[styles.ringPct, { color: progressColor }]}>
                {progressPercent}%
              </Text>
              {progressPercent === 100 && (
                <Text style={styles.ringDone}>🎉</Text>
              )}
            </View>
          </View>
        </View>

        {dates.length === 0 && (
          <View style={styles.emptyHistory}>
            <Text style={{ fontSize: 38 }}>📊</Text>
            <Text style={[styles.emptyText, { color: t.textLight }]}>
              No history yet.
            </Text>
            <Text style={[styles.emptyHint, { color: t.textLight }]}>
              Start checking off activities in the Tracker tab.
            </Text>
          </View>
        )}

        {dates.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: t.textLight }]}>
              TAP A DATE TO REVIEW
            </Text>

            {/* DATE LIST — entire row tappable */}
            {dates.map((date) => {
              const { dailyDone, weeklyDone, pct } = getStatsForDate(date);
              const active = selected === date;
              const barColor =
                pct === 100 ? "#16a34a" : pct >= 60 ? t.accent : "#f59e0b";

              return (
                <Pressable
                  key={date}
                  onPress={() => setSelected(active ? null : date)}
                  style={({ pressed }) => [
                    styles.dateBtn,
                    {
                      backgroundColor: active ? t.accent : t.dateListBtnBg,
                      borderColor: active ? t.accent : t.border,
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View style={styles.dateBtnTop}>
                    <Text
                      style={[
                        styles.dateBtnMain,
                        { color: active ? "#f9fafb" : t.text },
                      ]}
                    >
                      {formatDate(date)}
                    </Text>
                    <Text
                      style={[
                        styles.dateBtnPct,
                        { color: active ? "rgba(255,255,255,0.8)" : barColor },
                      ]}
                    >
                      {pct}%
                    </Text>
                  </View>

                  {/* Mini progress bar inside date row */}
                  <View
                    style={[
                      styles.dateMiniBar,
                      {
                        backgroundColor: active
                          ? "rgba(255,255,255,0.25)"
                          : t.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dateMiniBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: active ? "#fff" : barColor,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.dateBtnSub}>
                    <View
                      style={[
                        styles.miniPill,
                        {
                          backgroundColor: active
                            ? "rgba(255,255,255,0.2)"
                            : t.pillBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.miniPillText,
                          { color: active ? "#f9fafb" : t.pillText },
                        ]}
                      >
                        D: {dailyDone}/{activities.daily.length}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.miniPill,
                        {
                          backgroundColor: active
                            ? "rgba(255,255,255,0.2)"
                            : t.pillBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.miniPillText,
                          { color: active ? "#f9fafb" : t.pillText },
                        ]}
                      >
                        W: {weeklyDone}/{activities.weekly.length}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.tapHint,
                        {
                          color: active ? "rgba(255,255,255,0.7)" : t.textLight,
                        },
                      ]}
                    >
                      {active ? "▲ Hide" : "▼ Details"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </View>

      {/* DETAILS CARD — shown below when a date is selected */}
      {selected && (
        <View
          style={[
            styles.card,
            { backgroundColor: t.cardBg, borderColor: t.border },
          ]}
        >
          <Text style={[styles.detailTitle, { color: t.accentLight }]}>
            {formatDate(selected)}
          </Text>

          {/* Summary row */}
          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryChip,
                {
                  backgroundColor: "rgba(22,163,74,0.12)",
                  borderColor: "rgba(22,163,74,0.4)",
                },
              ]}
            >
              <Text
                style={{ color: "#16a34a", fontSize: 13, fontWeight: "700" }}
              >
                ✓{" "}
                {Object.values(selectedDaily).filter(Boolean).length +
                  Object.values(selectedWeekly).filter(Boolean).length}{" "}
                done
              </Text>
            </View>
            <View
              style={[
                styles.summaryChip,
                {
                  backgroundColor: "rgba(239,68,68,0.10)",
                  borderColor: "rgba(239,68,68,0.35)",
                },
              ]}
            >
              <Text
                style={{ color: "#ef4444", fontSize: 13, fontWeight: "700" }}
              >
                ✗{" "}
                {activities.daily.length -
                  Object.values(selectedDaily).filter(Boolean).length +
                  (activities.weekly.length -
                    Object.values(selectedWeekly).filter(Boolean).length)}{" "}
                missed
              </Text>
            </View>
          </View>

          {/* Daily */}
          <Text style={[styles.blockTitle, { color: t.accentLight }]}>
            Daily Tasks
          </Text>
          {activities.daily.map((name) => {
            const done = !!selectedDaily[name];
            const meta = getDailyMeta(name, customMeta);
            return (
              <View
                key={name}
                style={[styles.detailRow, { borderBottomColor: t.border }]}
              >
                <View
                  style={[
                    styles.detailStatus,
                    {
                      backgroundColor: done
                        ? "rgba(22,163,74,0.15)"
                        : "rgba(239,68,68,0.10)",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: done ? "#16a34a" : "#ef4444",
                    }}
                  >
                    {done ? "✓" : "✗"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.detailName,
                    { color: done ? t.text : t.textLight, flex: 1 },
                  ]}
                  numberOfLines={2}
                >
                  {name}
                </Text>
                <CategoryPill category={meta.category} />
                {meta.timeLabel ? (
                  <View
                    style={[styles.timePill, { backgroundColor: t.timePillBg }]}
                  >
                    <Text
                      style={[styles.timePillText, { color: t.timePillText }]}
                    >
                      {meta.timeLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}

          {/* Weekly */}
          <Text
            style={[styles.blockTitle, { color: t.accentLight, marginTop: 14 }]}
          >
            Weekly Tasks
          </Text>
          {activities.weekly.map((w) => {
            const done = !!selectedWeekly[w.name];
            const meta = getWeeklyMeta(w.name);
            return (
              <View
                key={w.name}
                style={[styles.detailRow, { borderBottomColor: t.border }]}
              >
                <View
                  style={[
                    styles.detailStatus,
                    {
                      backgroundColor: done
                        ? "rgba(22,163,74,0.15)"
                        : "rgba(239,68,68,0.10)",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: done ? "#16a34a" : "#ef4444",
                    }}
                  >
                    {done ? "✓" : "✗"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.detailName,
                    { color: done ? t.text : t.textLight, flex: 1 },
                  ]}
                  numberOfLines={2}
                >
                  {w.name}
                </Text>
                <CategoryPill category={meta.category} />
              </View>
            );
          })}

          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeBtn, { borderColor: t.border }]}
            onPress={() => setSelected(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeBtnText, { color: t.textLight }]}>
              ▲ Close Details
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, marginTop: 3 },

  // Progress ring
  ringOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: { fontSize: 16, fontWeight: "800" },
  ringDone: { fontSize: 11, textAlign: "center" },

  emptyHistory: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptyHint: { fontSize: 13, textAlign: "center", opacity: 0.7 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Date buttons — entire row tappable
  dateBtn: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 6,
  },
  dateBtnTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateBtnMain: { fontSize: 14, fontWeight: "700" },
  dateBtnPct: { fontSize: 14, fontWeight: "800" },
  dateMiniBar: { height: 4, borderRadius: 999, overflow: "hidden" },
  dateMiniBarFill: { height: 4, borderRadius: 999 },
  dateBtnSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  miniPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  miniPillText: { fontSize: 11, fontWeight: "600" },
  tapHint: { fontSize: 11, marginLeft: "auto" },

  // Details card
  detailTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  summaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  blockTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  detailStatus: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  detailName: { fontSize: 12, fontWeight: "500" },
  timePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  timePillText: { fontSize: 10, fontWeight: "600" },
  closeBtn: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  closeBtnText: { fontSize: 13, fontWeight: "600" },
});
