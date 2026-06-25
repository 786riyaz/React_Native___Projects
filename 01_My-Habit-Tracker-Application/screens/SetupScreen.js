// screens/SetupScreen.js
import { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import CategoryPill from "../components/CategoryPill";
import { useApp } from "../config/AppContext";
import { CATEGORY_ORDER, getDailyMeta } from "../config/activityConfig";
import { confirmAction, showAlert } from "../utils/confirm";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SetupScreen() {
  const { activities, setActivities, customMeta, setCustomMeta, themeObj } =
    useApp();
  const t = themeObj;

  const [dailyInput, setDailyInput] = useState("");
  const [weeklyInput, setWeeklyInput] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);

  const [editModal, setEditModal] = useState(false);
  const [editDaily, setEditDaily] = useState(null);
  const [editDailyName, setEditDailyName] = useState("");
  const [editDailyCategory, setEditDailyCategory] = useState("Other / Custom");
  const [editDailyTime, setEditDailyTime] = useState("");
  const [showCatPicker, setShowCatPicker] = useState(false);

  const sortedDaily = useMemo(() => {
    return [...activities.daily]
      .map((name) => {
        const meta = getDailyMeta(name, customMeta);
        return { name, ...meta };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [activities.daily, customMeta]);

  const addDaily = () => {
    const name = dailyInput.trim();
    if (!name) return;
    if (!activities.daily.includes(name)) {
      setActivities({ ...activities, daily: [...activities.daily, name] });
      if (Platform.OS !== "web") Vibration.vibrate(20);
    }
    setDailyInput("");
  };

  const startEditDaily = (name) => {
    const meta = getDailyMeta(name, customMeta);
    setEditDaily(name);
    setEditDailyName(name);
    setEditDailyCategory(meta.category || "Other / Custom");
    setEditDailyTime(meta.time || "");
    setShowCatPicker(false);
    setEditModal(true);
  };

  const saveDailyEdit = () => {
    if (!editDaily || !editDailyName.trim()) return;
    const newName = editDailyName.trim();
    setActivities((prev) => ({
      ...prev,
      daily: prev.daily.map((d) => (d === editDaily ? newName : d)),
    }));
    setCustomMeta((prev) => {
      const next = { ...prev };
      if (editDaily !== newName) delete next[editDaily];
      next[newName] = { category: editDailyCategory, time: editDailyTime };
      return next;
    });
    setEditModal(false);
    setEditDaily(null);
  };

  const deleteDaily = (actName) => {
    confirmAction("Delete Activity", `Remove "${actName}"?`, () => {
      setActivities((prev) => ({
        ...prev,
        daily: prev.daily.filter((d) => d !== actName),
      }));
      setCustomMeta((prev) => {
        const next = { ...prev };
        delete next[actName];
        return next;
      });
    });
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const addWeekly = () => {
    const name = weeklyInput.trim();
    if (!name || selectedDays.length === 0) {
      showAlert("Notice", "Enter a name and select at least one day.");
      return;
    }
    if (!activities.weekly.some((w) => w.name === name)) {
      setActivities({
        ...activities,
        weekly: [...activities.weekly, { name, days: selectedDays }],
      });
      if (Platform.OS !== "web") Vibration.vibrate(20);
    }
    setWeeklyInput("");
    setSelectedDays([]);
  };

  const deleteWeekly = (actName) => {
    confirmAction("Delete Activity", `Remove "${actName}"?`, () =>
      setActivities((prev) => ({
        ...prev,
        weekly: prev.weekly.filter((w) => w.name !== actName),
      })),
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── DAILY ── */}
      <View
        style={[
          styles.card,
          { backgroundColor: t.cardBg, borderColor: t.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: t.accentLight }]}>
          Setup Activities
        </Text>

        <View style={[styles.sectionHead, { borderBottomColor: t.border }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>
            📅 Daily Activities
          </Text>
          <View
            style={[
              styles.countPill,
              {
                borderColor: t.accent,
                backgroundColor: "rgba(168,85,247,0.12)",
              },
            ]}
          >
            <Text style={{ color: t.accent, fontSize: 11, fontWeight: "800" }}>
              {activities.daily.length}
            </Text>
          </View>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: t.inputBg,
                color: t.inputText,
                borderColor: t.border,
              },
            ]}
            placeholder="New daily activity name..."
            placeholderTextColor={t.textLight}
            value={dailyInput}
            onChangeText={setDailyInput}
            onSubmitEditing={addDaily}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addSmallBtn, { backgroundColor: t.accent }]}
            onPress={addDaily}
            activeOpacity={0.75}
          >
            <Text style={styles.addSmallBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <Text style={[styles.hint, { color: t.textLight }]}>
          Tap a row to edit · Tap ✕ to remove
        </Text>

        {sortedDaily.map((item, index) => (
          // ✅ Tapping the name/row opens edit modal
          <Pressable
            key={item.name}
            onPress={() => startEditDaily(item.name)}
            style={({ pressed }) => [
              styles.listItem,
              {
                borderBottomColor: t.border,
                borderBottomWidth: index < sortedDaily.length - 1 ? 0.5 : 0,
                backgroundColor: pressed
                  ? "rgba(168,85,247,0.07)"
                  : "transparent",
                borderRadius: pressed ? 10 : 0,
              },
            ]}
          >
            <View style={styles.itemLeft}>
              <Text
                style={[styles.itemName, { color: t.text }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <View style={styles.itemMeta}>
                <CategoryPill category={item.category} />
                {item.timeLabel ? (
                  <View
                    style={[styles.timePill, { backgroundColor: t.timePillBg }]}
                  >
                    <Text
                      style={[styles.timePillText, { color: t.timePillText }]}
                    >
                      {item.timeLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={styles.itemBtns}>
              <View style={[styles.editHintBtn, { borderColor: t.border }]}>
                <Text style={{ color: t.accentLight, fontSize: 13 }}>
                  ✎ Edit
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteDaily(item.name)}
                style={[styles.deleteIconBtn]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.5}
              >
                <Text
                  style={{ color: "#ef4444", fontSize: 18, fontWeight: "700" }}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        ))}
      </View>

      {/* ── WEEKLY ── */}
      <View
        style={[
          styles.card,
          { backgroundColor: t.cardBg, borderColor: t.border },
        ]}
      >
        <View
          style={[
            styles.sectionHead,
            { borderBottomColor: t.border, marginBottom: 12 },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: t.text }]}>
            🗓 Weekly Activities
          </Text>
          <View
            style={[
              styles.countPill,
              {
                borderColor: t.accent,
                backgroundColor: "rgba(168,85,247,0.12)",
              },
            ]}
          >
            <Text style={{ color: t.accent, fontSize: 11, fontWeight: "800" }}>
              {activities.weekly.length}
            </Text>
          </View>
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: t.inputBg,
              color: t.inputText,
              borderColor: t.border,
              marginBottom: 10,
            },
          ]}
          placeholder="Weekly activity name..."
          placeholderTextColor={t.textLight}
          value={weeklyInput}
          onChangeText={setWeeklyInput}
          returnKeyType="done"
        />

        <Text style={[styles.hint, { color: t.textLight, marginBottom: 8 }]}>
          Select which days:
        </Text>
        <View style={styles.daysRow}>
          {DAY_LABELS.map((d) => {
            const active = selectedDays.includes(d);
            return (
              <TouchableOpacity
                key={d}
                onPress={() => toggleDay(d)}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: active ? t.accent : t.inputBg,
                    borderColor: active ? t.accent : t.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: active ? "#fff" : t.text,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.addFullBtn, { backgroundColor: t.accent }]}
          onPress={addWeekly}
          activeOpacity={0.75}
        >
          <Text style={styles.addBtnText}>+ Add Weekly Activity</Text>
        </TouchableOpacity>

        {activities.weekly.length === 0 && (
          <Text style={[styles.emptyMsg, { color: t.textLight }]}>
            No weekly activities yet.
          </Text>
        )}

        {activities.weekly.map((w, index) => (
          <View
            key={w.name}
            style={[
              styles.listItem,
              {
                borderBottomColor: t.border,
                borderBottomWidth:
                  index < activities.weekly.length - 1 ? 0.5 : 0,
                marginTop: 4,
              },
            ]}
          >
            <View style={styles.itemLeft}>
              <Text
                style={[styles.itemName, { color: t.text }]}
                numberOfLines={2}
              >
                {w.name}
              </Text>
              <View style={styles.dayTagsRow}>
                {(w.days || []).map((day) => (
                  <View
                    key={day}
                    style={[
                      styles.dayTag,
                      {
                        backgroundColor: "rgba(168,85,247,0.18)",
                        borderColor: t.accent,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: t.accentLight,
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => deleteWeekly(w.name)}
              style={styles.deleteIconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.5}
            >
              <Text
                style={{ color: "#ef4444", fontSize: 18, fontWeight: "700" }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* ── EDIT MODAL ── */}
      <Modal
        visible={editModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditModal(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: t.cardBg, borderColor: t.border },
            ]}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <Text
              style={[
                styles.cardTitle,
                { color: t.accentLight, marginBottom: 16 },
              ]}
            >
              Edit Activity
            </Text>

            <Text style={[styles.fieldLabel, { color: t.textLight }]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: t.inputBg,
                  color: t.inputText,
                  borderColor: t.border,
                  marginBottom: 14,
                },
              ]}
              value={editDailyName}
              onChangeText={setEditDailyName}
              placeholder="Activity name"
              placeholderTextColor={t.textLight}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: t.textLight }]}>
              Category
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: t.inputBg,
                  borderColor: t.border,
                  marginBottom: 6,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
              onPress={() => setShowCatPicker(!showCatPicker)}
              activeOpacity={0.8}
            >
              <Text style={{ color: t.inputText, fontSize: 13 }}>
                {editDailyCategory}
              </Text>
              <Text style={{ color: t.textLight }}>
                {showCatPicker ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            {showCatPicker && (
              <ScrollView
                style={[
                  styles.catDropdown,
                  { borderColor: t.border, backgroundColor: t.inputBg },
                ]}
                nestedScrollEnabled
              >
                {CATEGORY_ORDER.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setEditDailyCategory(c);
                      setShowCatPicker(false);
                    }}
                    style={[
                      styles.catOption,
                      {
                        backgroundColor:
                          editDailyCategory === c ? t.accent : "transparent",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color:
                          editDailyCategory === c ? "#f9fafb" : t.inputText,
                        padding: 11,
                        fontSize: 13,
                      }}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text
              style={[styles.fieldLabel, { color: t.textLight, marginTop: 8 }]}
            >
              Time (24hr, e.g. 06:30)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: t.inputBg,
                  color: t.inputText,
                  borderColor: t.border,
                  marginBottom: 20,
                },
              ]}
              value={editDailyTime}
              onChangeText={setEditDailyTime}
              placeholder="e.g. 06:30"
              placeholderTextColor={t.textLight}
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: t.accent }]}
                onPress={saveDailyEdit}
                activeOpacity={0.8}
              >
                <Text style={styles.addBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: t.border,
                  },
                ]}
                onPress={() => {
                  setEditModal(false);
                  setShowCatPicker(false);
                }}
              >
                <Text style={{ color: t.text, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 50, gap: 12 },

  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 12,
  },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },

  hint: { fontSize: 11, textAlign: "center", marginBottom: 6, opacity: 0.7 },

  inputRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: { borderRadius: 14, borderWidth: 1, padding: 12, fontSize: 13 },
  addSmallBtn: {
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  addSmallBtnText: { color: "#f9fafb", fontWeight: "800", fontSize: 13 },
  addFullBtn: {
    borderRadius: 14,
    padding: 13,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  addBtnText: { color: "#f9fafb", fontWeight: "800", fontSize: 14 },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 8,
    paddingHorizontal: 4,
  },
  itemLeft: { flex: 1, gap: 5 },
  itemName: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  timePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  timePillText: { fontSize: 11, fontWeight: "600" },

  itemBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  editHintBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteIconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },

  dayTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  dayTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },

  emptyMsg: { textAlign: "center", fontSize: 13, paddingVertical: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(148,163,184,0.45)",
    alignSelf: "center",
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  catDropdown: {
    maxHeight: 190,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  catOption: { borderRadius: 6 },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
