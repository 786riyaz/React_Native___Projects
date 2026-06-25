// screens/DashboardScreen.js
import { useMemo, useRef, useState } from "react";
import {
  Animated,
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

// ─── Inline expandable detail panel ──────────────────────────────────────────
// Renders immediately below the tapped date row inside the same list.
function DetailPanel({ date, entry, activities, customMeta, t, onClose }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  // Animate in on mount
  useMemo(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const selectedDaily = entry?.daily || {};
  const selectedWeekly = entry?.weekly || {};

  const doneCount =
    Object.values(selectedDaily).filter(Boolean).length +
    Object.values(selectedWeekly).filter(Boolean).length;
  const missedCount =
    activities.daily.length -
    Object.values(selectedDaily).filter(Boolean).length +
    (activities.weekly.length -
      Object.values(selectedWeekly).filter(Boolean).length);

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

  return (
    <Animated.View
      style={[
        styles.detailPanel,
        {
          backgroundColor: t.cardBg,
          borderColor: t.accent,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Connector arrow pointing up to the tapped row */}
      <View style={[styles.panelArrow, { borderBottomColor: t.accent }]} />

      {/* Header */}
      <View style={styles.panelHeader}>
        <Text style={[styles.panelTitle, { color: t.accentLight }]}>
          {formatDate(date)}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeX, { borderColor: t.border }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text style={{ color: t.textLight, fontSize: 14, fontWeight: "700" }}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary chips */}
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryChip,
            {
              backgroundColor: "rgba(22,163,74,0.14)",
              borderColor: "rgba(22,163,74,0.45)",
            },
          ]}
        >
          <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "800" }}>
            ✓ {doneCount} done
          </Text>
        </View>
        <View
          style={[
            styles.summaryChip,
            {
              backgroundColor: "rgba(239,68,68,0.12)",
              borderColor: "rgba(239,68,68,0.4)",
            },
          ]}
        >
          <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "800" }}>
            ✗ {missedCount} missed
          </Text>
        </View>
      </View>

      {/* Daily tasks */}
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
                styles.statusIcon,
                {
                  backgroundColor: done
                    ? "rgba(22,163,74,0.15)"
                    : "rgba(239,68,68,0.10)",
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: done ? "#16a34a" : "#ef4444",
                  fontWeight: "900",
                }}
              >
                {done ? "✓" : "✗"}
              </Text>
            </View>
            <Text
              style={[
                styles.detailName,
                { color: done ? t.text : t.textLight },
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
                <Text style={[styles.timePillText, { color: t.timePillText }]}>
                  {meta.timeLabel}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}

      {/* Weekly tasks */}
      <Text
        style={[styles.blockTitle, { color: t.accentLight, marginTop: 12 }]}
      >
        Weekly Tasks
      </Text>
      {activities.weekly.length === 0 && (
        <Text style={[styles.emptyHint, { color: t.textLight }]}>
          No weekly activities configured.
        </Text>
      )}
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
                styles.statusIcon,
                {
                  backgroundColor: done
                    ? "rgba(22,163,74,0.15)"
                    : "rgba(239,68,68,0.10)",
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: done ? "#16a34a" : "#ef4444",
                  fontWeight: "900",
                }}
              >
                {done ? "✓" : "✗"}
              </Text>
            </View>
            <Text
              style={[
                styles.detailName,
                { color: done ? t.text : t.textLight },
              ]}
              numberOfLines={2}
            >
              {w.name}
            </Text>
            <CategoryPill category={meta.category} />
          </View>
        );
      })}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { activities, history, customMeta, themeObj } = useApp();
  const t = themeObj;

  // ✅ KEY FIX: selected is the date whose details are shown INLINE
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

  const getStats = (date) => {
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

  // Progress % for the ring — shows selected date's progress, else latest date
  const ringDate = selected || dates[0] || null;
  const progressPct = useMemo(
    () => (ringDate ? getStats(ringDate).pct : 0),
    [ringDate, activities, history],
  );
  const ringColor =
    progressPct === 100 ? "#16a34a" : progressPct >= 60 ? t.accent : "#f59e0b";

  const handleDatePress = (date) => {
    // Toggle: tap same date → collapse, tap different → expand that one
    setSelected((prev) => (prev === date ? null : date));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── TOP CARD: title + ring ── */}
      <View
        style={[
          styles.card,
          { backgroundColor: t.cardBg, borderColor: t.border },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.cardTitle, { color: t.accentLight }]}>
              Dashboard
            </Text>
            <Text style={[styles.headerSub, { color: t.textLight }]}>
              {selected
                ? formatDate(selected)
                : dates.length > 0
                  ? "Tap a date to review"
                  : "No history yet"}
            </Text>
          </View>

          {/* Progress ring */}
          <View style={[styles.ringOuter, { borderColor: ringColor }]}>
            <View style={[styles.ringInner, { backgroundColor: t.cardBg }]}>
              <Text style={[styles.ringPct, { color: ringColor }]}>
                {progressPct}%
              </Text>
              {progressPct === 100 && (
                <Text style={{ fontSize: 10, textAlign: "center" }}>🎉</Text>
              )}
            </View>
          </View>
        </View>

        {/* Empty state */}
        {dates.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 40 }}>📊</Text>
            <Text style={[styles.emptyText, { color: t.textLight }]}>
              No history yet.
            </Text>
            <Text style={[styles.emptyHint, { color: t.textLight }]}>
              Start checking off activities in the Tracker tab.
            </Text>
          </View>
        )}

        {/* ── DATE LIST with inline detail panels ── */}
        {dates.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: t.textLight }]}>
              TAP A DATE TO REVIEW
            </Text>

            {dates.map((date) => {
              const { dailyDone, weeklyDone, pct } = getStats(date);
              const active = selected === date;
              const barColor =
                pct === 100 ? "#16a34a" : pct >= 60 ? t.accent : "#f59e0b";

              return (
                // ✅ Each date + its detail panel are grouped together
                <View key={date}>
                  {/* Date row button */}
                  <Pressable
                    onPress={() => handleDatePress(date)}
                    style={({ pressed }) => [
                      styles.dateBtn,
                      {
                        backgroundColor: active ? t.accent : t.dateListBtnBg,
                        borderColor: active ? t.accent : t.border,
                        // When expanded, flatten bottom corners to merge with panel
                        borderBottomLeftRadius: active ? 0 : 14,
                        borderBottomRightRadius: active ? 0 : 14,
                        marginBottom: active ? 0 : 8,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.99 : 1 }],
                      },
                    ]}
                  >
                    {/* Date + percentage */}
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
                          {
                            color: active ? "rgba(255,255,255,0.9)" : barColor,
                          },
                        ]}
                      >
                        {pct}%
                      </Text>
                    </View>

                    {/* Mini progress bar */}
                    <View
                      style={[
                        styles.miniBar,
                        {
                          backgroundColor: active
                            ? "rgba(255,255,255,0.22)"
                            : t.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.miniBarFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: active ? "#fff" : barColor,
                          },
                        ]}
                      />
                    </View>

                    {/* Stats + expand hint */}
                    <View style={styles.dateBtnSub}>
                      <View
                        style={[
                          styles.miniPill,
                          {
                            backgroundColor: active
                              ? "rgba(255,255,255,0.18)"
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
                              ? "rgba(255,255,255,0.18)"
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
                          styles.expandHint,
                          {
                            color: active
                              ? "rgba(255,255,255,0.75)"
                              : t.textLight,
                          },
                        ]}
                      >
                        {active ? "▲ Hide" : "▼ Details"}
                      </Text>
                    </View>
                  </Pressable>

                  {/* ✅ Detail panel renders RIGHT HERE, directly below this row */}
                  {active && (
                    <DetailPanel
                      date={date}
                      entry={history[date]}
                      activities={activities}
                      customMeta={customMeta}
                      t={t}
                      onClose={() => setSelected(null)}
                    />
                  )}

                  {/* Spacer below expanded panel */}
                  {active && <View style={{ height: 8 }} />}
                </View>
              );
            })}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 50, gap: 12 },

  // Main card
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

  // Ring
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

  // Empty
  emptyBox: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptyHint: { fontSize: 13, textAlign: "center", opacity: 0.7 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Date row button
  dateBtn: {
    borderRadius: 14,
    padding: 12,
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
  miniBar: { height: 4, borderRadius: 999, overflow: "hidden" },
  miniBarFill: { height: 4, borderRadius: 999 },
  dateBtnSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  miniPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  miniPillText: { fontSize: 11, fontWeight: "600" },
  expandHint: { fontSize: 11, marginLeft: "auto" },

  // ✅ Inline detail panel — connected to the row above it
  detailPanel: {
    borderWidth: 1,
    borderTopWidth: 0, // flush with the date row above
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 14,
    paddingTop: 10,
  },

  // Small upward arrow connector
  panelArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
    marginBottom: 8,
    marginTop: -2,
  },

  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  panelTitle: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  closeX: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Summary
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  summaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  // Detail rows
  blockTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 0.5,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  detailName: { flex: 1, fontSize: 12, fontWeight: "500", lineHeight: 17 },
  timePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  timePillText: { fontSize: 10, fontWeight: "600" },
});
