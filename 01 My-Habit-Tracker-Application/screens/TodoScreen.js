// screens/TodoScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
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
import { useApp } from "../config/AppContext";
import { confirmAction } from "../utils/confirm";

// ─── Notification setup ───────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function requestPermission() {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return newStatus === "granted";
}

async function scheduleNotif(todo) {
  if (Platform.OS === "web" || !todo.dueDateTime) return null;
  const due = new Date(todo.dueDateTime);
  if (due <= new Date()) return null;
  try {
    if (!(await requestPermission())) return null;
    if (todo.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        todo.notificationId,
      ).catch(() => {});
    }
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Task Reminder",
        body: todo.task,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: { date: due },
    });
  } catch {
    return null;
  }
}

async function cancelNotif(id) {
  if (!id || Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

// ─── Date/time helpers ────────────────────────────────────────────────────────
const STORAGE_KEY = "personal-tracker-todos";
const CATEGORIES = ["Learning", "Notes", "Doubt", "Work", "Personal"];
const CATEGORY_ICONS = {
  Learning: "📚",
  Notes: "📄",
  Doubt: "❓",
  Work: "💼",
  Personal: "👤",
};
const CATEGORY_COLORS = {
  Learning: "#0ea5e9",
  Notes: "#a855f7",
  Doubt: "#f59e0b",
  Work: "#7c3aed",
  Personal: "#64748b",
};

// 12-hour AM/PM label for a stored ISO string
function formatDueLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const todayStr = now.toDateString();
  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  if (d.toDateString() === todayStr) return `Today, ${time}`;
  if (d.toDateString() === tom.toDateString()) return `Tomorrow, ${time}`;
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    `, ${time}`
  );
}

function isOverdue(iso) {
  return iso ? new Date(iso) < new Date() : false;
}
function isDueSoon(iso) {
  if (!iso) return false;
  const diff = new Date(iso) - new Date();
  return diff > 0 && diff < 3600000;
}

// Platform-safe DateTimePicker
let DateTimePicker = null;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

// ─── Hours & minutes arrays for custom picker ─────────────────────────────────
const HOURS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
); // 01–12
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
); // 00,05…55
const AMPM = ["AM", "PM"];

// ─── Custom 12-hr time picker wheel (works on Android + iOS + Web) ────────────
function TimePicker({ value, onChange, t }) {
  // value = { hour12: "07", minute: "30", ampm: "AM" }
  return (
    <View
      style={[
        tpStyles.wrap,
        { backgroundColor: t.inputBg, borderColor: t.border },
      ]}
    >
      {/* Hour column */}
      <ScrollView style={tpStyles.col} showsVerticalScrollIndicator={false}>
        {HOURS.map((h) => (
          <TouchableOpacity
            key={h}
            onPress={() => onChange({ ...value, hour12: h })}
            style={[
              tpStyles.cell,
              value.hour12 === h && {
                backgroundColor: t.accent,
                borderRadius: 8,
              },
            ]}
          >
            <Text
              style={[
                tpStyles.cellText,
                { color: value.hour12 === h ? "#fff" : t.text },
              ]}
            >
              {h}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[tpStyles.colon, { color: t.text }]}>:</Text>

      {/* Minute column */}
      <ScrollView style={tpStyles.col} showsVerticalScrollIndicator={false}>
        {MINUTES.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => onChange({ ...value, minute: m })}
            style={[
              tpStyles.cell,
              value.minute === m && {
                backgroundColor: t.accent,
                borderRadius: 8,
              },
            ]}
          >
            <Text
              style={[
                tpStyles.cellText,
                { color: value.minute === m ? "#fff" : t.text },
              ]}
            >
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* AM/PM column */}
      <View style={tpStyles.ampmCol}>
        {AMPM.map((ap) => (
          <TouchableOpacity
            key={ap}
            onPress={() => onChange({ ...value, ampm: ap })}
            style={[
              tpStyles.ampmCell,
              value.ampm === ap && {
                backgroundColor: t.accent,
                borderRadius: 8,
              },
            ]}
          >
            <Text
              style={[
                tpStyles.ampmText,
                { color: value.ampm === ap ? "#fff" : t.text },
              ]}
            >
              {ap}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const tpStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    marginBottom: 12,
  },
  col: { width: 54, maxHeight: 140 },
  cell: { alignItems: "center", paddingVertical: 7 },
  cellText: { fontSize: 18, fontWeight: "700" },
  colon: { fontSize: 22, fontWeight: "900", marginHorizontal: 4 },
  ampmCol: { flexDirection: "column", gap: 6, marginLeft: 8 },
  ampmCell: { paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" },
  ampmText: { fontSize: 14, fontWeight: "800" },
});

// Convert time-picker value → full Date ISO
function timePickerToISO(dateISO, tp) {
  const base = dateISO ? new Date(dateISO) : new Date();
  let h = parseInt(tp.hour12, 10);
  if (tp.ampm === "PM" && h !== 12) h += 12;
  if (tp.ampm === "AM" && h === 12) h = 0;
  base.setHours(h, parseInt(tp.minute, 10), 0, 0);
  return base.toISOString();
}

// Convert ISO → time-picker value
function isoToTimePicker(iso) {
  const d = iso ? new Date(iso) : new Date();
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  // Round minute to nearest 5
  const rawMin = d.getMinutes();
  const roundedMin = (Math.round(rawMin / 5) * 5) % 60;
  return {
    hour12: String(h12).padStart(2, "0"),
    minute: String(roundedMin).padStart(2, "0"),
    ampm,
  };
}

// ─── Date-only mini-picker (next 14 days) ────────────────────────────────────
function DatePicker({ selectedISO, onSelect, t }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 10 }}
    >
      <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
        {days.map((d, i) => {
          const iso = d.toISOString();
          const sel =
            selectedISO &&
            new Date(selectedISO).toDateString() === d.toDateString();
          const label =
            i === 0
              ? "Today"
              : i === 1
                ? "Tmrw"
                : d.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onSelect(d)}
              style={[
                dpStyles.chip,
                {
                  backgroundColor: sel ? t.accent : t.inputBg,
                  borderColor: sel ? t.accent : t.border,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: sel ? "#fff" : t.text,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const dpStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
});

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function TaskModal({ visible, onClose, onSave, editingTodo, t }) {
  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("Learning");
  const [dateISO, setDateISO] = useState(null); // selected date ISO
  const [timePicker, setTimePicker] = useState(isoToTimePicker(null));
  const [showTime, setShowTime] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingTodo) {
        setTaskText(editingTodo.task);
        setCategory(editingTodo.category);
        const hasDue = !!editingTodo.dueDateTime;
        setHasReminder(hasDue);
        setDateISO(hasDue ? editingTodo.dueDateTime : null);
        setTimePicker(isoToTimePicker(hasDue ? editingTodo.dueDateTime : null));
      } else {
        setTaskText("");
        setCategory("Learning");
        setDateISO(null);
        setTimePicker(isoToTimePicker(null));
        setHasReminder(false);
      }
      setShowTime(false);
    }
  }, [visible, editingTodo]);

  const handleSelectDate = (d) => {
    // Keep current time when date changes
    const updated = timePickerToISO(d.toISOString(), timePicker);
    setDateISO(updated);
  };

  const handleTimeChange = (tp) => {
    setTimePicker(tp);
    if (dateISO) setDateISO(timePickerToISO(dateISO, tp));
  };

  // Computed due label
  const dueISO =
    hasReminder && dateISO ? timePickerToISO(dateISO, timePicker) : null;
  const dueLabel = formatDueLabel(dueISO);
  const overdueNow = isOverdue(dueISO);

  const handleSave = () => {
    if (!taskText.trim()) return;
    onSave({ task: taskText.trim(), category, dueDateTime: dueISO });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: t.cardBg, borderColor: t.border },
          ]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandle} />

          <Text style={[styles.sheetTitle, { color: t.accentLight }]}>
            {editingTodo ? "✎  Edit Task" : "＋  New Task"}
          </Text>

          {/* ── Task text ── */}
          <Text style={[styles.label, { color: t.textLight }]}>Task</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: t.inputBg,
                color: t.inputText,
                borderColor: t.border,
              },
            ]}
            placeholder="What needs to be done?"
            placeholderTextColor={t.textLight}
            value={taskText}
            onChangeText={setTaskText}
            multiline
            numberOfLines={3}
            autoFocus
            blurOnSubmit
          />

          {/* ── Category ── */}
          <Text style={[styles.label, { color: t.textLight }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 14 }}
          >
            <View style={{ flexDirection: "row", gap: 8, paddingVertical: 2 }}>
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.catChipSm,
                      {
                        backgroundColor: active
                          ? CATEGORY_COLORS[cat]
                          : t.inputBg,
                        borderColor: active ? CATEGORY_COLORS[cat] : t.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 13 }}>{CATEGORY_ICONS[cat]}</Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: active ? "#fff" : t.text,
                        fontWeight: "700",
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* ── Reminder toggle ── */}
          <View style={styles.reminderToggleRow}>
            <Text
              style={[styles.label, { color: t.textLight, marginBottom: 0 }]}
            >
              🔔 Set Reminder
            </Text>
            <TouchableOpacity
              onPress={() => {
                setHasReminder(!hasReminder);
                setShowTime(false);
              }}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: hasReminder ? t.accent : t.inputBg,
                  borderColor: hasReminder ? t.accent : t.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[styles.toggleCircle, { left: hasReminder ? 22 : 2 }]}
              />
            </TouchableOpacity>
          </View>

          {hasReminder && (
            <View
              style={[
                styles.reminderBox,
                {
                  borderColor: t.border,
                  backgroundColor: "rgba(168,85,247,0.06)",
                },
              ]}
            >
              {/* Current due label */}
              {dueLabel ? (
                <View
                  style={[
                    styles.dueLabelRow,
                    {
                      backgroundColor: overdueNow
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(168,85,247,0.12)",
                      borderColor: overdueNow ? "#ef4444" : t.accent,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>
                    {overdueNow ? "🔴" : "🔔"}
                  </Text>
                  <Text
                    style={[
                      styles.dueLabelText,
                      { color: overdueNow ? "#ef4444" : t.accentLight },
                    ]}
                  >
                    {dueLabel}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.noDueHint, { color: t.textLight }]}>
                  Pick a date and time below
                </Text>
              )}

              {/* ── Date picker (horizontal chips: Today, Tmrw, next 12 days) ── */}
              <Text style={[styles.subLabel, { color: t.textLight }]}>
                📅 Date
              </Text>
              <DatePicker
                selectedISO={dateISO}
                onSelect={handleSelectDate}
                t={t}
              />

              {/* ── Time section ── */}
              <TouchableOpacity
                onPress={() => setShowTime(!showTime)}
                style={[
                  styles.timeToggleBtn,
                  { borderColor: t.border, backgroundColor: t.inputBg },
                ]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16 }}>🕐</Text>
                <Text style={[styles.timeToggleText, { color: t.text }]}>
                  {`${timePicker.hour12}:${timePicker.minute} ${timePicker.ampm}`}
                </Text>
                <Text style={{ color: t.textLight, fontSize: 12 }}>
                  {showTime ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {showTime && (
                <TimePicker
                  value={timePicker}
                  onChange={handleTimeChange}
                  t={t}
                />
              )}
            </View>
          )}

          {/* ── Save / Cancel ── */}
          <View style={styles.modalBtns}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: t.accent,
                  opacity: taskText.trim() ? 1 : 0.4,
                },
              ]}
              onPress={handleSave}
              disabled={!taskText.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {editingTodo ? "Save Changes" : "Add Task"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: t.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: t.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── TodoItem ─────────────────────────────────────────────────────────────────
function TodoItem({ todo, onToggle, onDelete, onEdit, accentColor, t }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    if (Platform.OS !== "web") Vibration.vibrate(25);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle();
  };

  const overdue = !todo.completed && isOverdue(todo.dueDateTime);
  const dueSoon = !todo.completed && isDueSoon(todo.dueDateTime);
  const dueLabel = formatDueLabel(todo.dueDateTime);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View
        style={[
          styles.todoItem,
          {
            backgroundColor: todo.completed
              ? "rgba(22,163,74,0.10)"
              : overdue
                ? "rgba(239,68,68,0.07)"
                : t.checkRowBg,
            borderColor: todo.completed
              ? "rgba(22,163,74,0.35)"
              : overdue
                ? "rgba(239,68,68,0.5)"
                : t.checkRowBorder,
            borderLeftColor: todo.completed
              ? "#16a34a"
              : overdue
                ? "#ef4444"
                : accentColor,
          },
        ]}
      >
        {/* ✅ CHECKBOX — tap to toggle complete/incomplete */}
        <TouchableOpacity
          onPress={handleToggle}
          style={[
            styles.checkbox,
            {
              borderColor: todo.completed ? "#16a34a" : accentColor,
              backgroundColor: todo.completed ? "#16a34a" : "transparent",
            },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          {todo.completed && (
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "900" }}>
              ✓
            </Text>
          )}
        </TouchableOpacity>

        {/* Task name + due date — tapping row also toggles */}
        <Pressable style={{ flex: 1 }} onPress={handleToggle}>
          <Text
            style={[
              styles.todoText,
              { color: t.text },
              todo.completed && {
                textDecorationLine: "line-through",
                color: t.textLight,
                opacity: 0.6,
              },
            ]}
            numberOfLines={3}
          >
            {todo.task}
          </Text>

          {/* Due date badge */}
          {dueLabel && (
            <View
              style={[
                styles.dueBadge,
                {
                  backgroundColor: overdue
                    ? "rgba(239,68,68,0.14)"
                    : dueSoon
                      ? "rgba(245,158,11,0.14)"
                      : "rgba(148,163,184,0.10)",
                  borderColor: overdue
                    ? "rgba(239,68,68,0.4)"
                    : dueSoon
                      ? "rgba(245,158,11,0.4)"
                      : t.border,
                },
              ]}
            >
              <Text style={{ fontSize: 10 }}>
                {overdue ? "🔴" : dueSoon ? "🟡" : "🔔"}
              </Text>
              <Text
                style={[
                  styles.dueText,
                  {
                    color: overdue
                      ? "#ef4444"
                      : dueSoon
                        ? "#f59e0b"
                        : t.textLight,
                    fontWeight: overdue || dueSoon ? "700" : "500",
                  },
                ]}
              >
                {overdue ? "Overdue · " : ""}
                {dueLabel}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Edit + Delete */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onEdit}
            style={[
              styles.actionBtn,
              {
                backgroundColor: "rgba(168,85,247,0.12)",
                borderColor: "rgba(168,85,247,0.35)",
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.6}
          >
            <Text style={{ fontSize: 14, color: "#a855f7" }}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={[
              styles.actionBtn,
              {
                backgroundColor: "rgba(239,68,68,0.12)",
                borderColor: "rgba(239,68,68,0.35)",
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.5}
          >
            <Text style={{ color: "#ef4444", fontSize: 14, fontWeight: "700" }}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TodoScreen() {
  const { themeObj } = useApp();
  const t = themeObj;

  const [todos, setTodos] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [modalVisible, setModal] = useState(false);
  const [editingTodo, setEditing] = useState(null);

  // Load
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((s) => {
        if (s) setTodos(JSON.parse(s));
      })
      .catch(console.error)
      .finally(() => setIsLoaded(true));
  }, []);

  // Save
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos)).catch(
      console.error,
    );
  }, [todos, isLoaded]);

  // Request permission on mount
  useEffect(() => {
    if (Platform.OS !== "web") requestPermission();
  }, []);

  // ── handlers ──
  const openAdd = () => {
    setEditing(null);
    setModal(true);
  };
  const openEdit = (todo) => {
    setEditing(todo);
    setModal(true);
  };

  const handleSave = async ({ task, category, dueDateTime }) => {
    if (editingTodo) {
      const updated = {
        ...editingTodo,
        task,
        category,
        dueDateTime: dueDateTime || null,
        updatedAt: new Date().toISOString(),
      };
      const nid = await scheduleNotif(updated);
      if (nid) updated.notificationId = nid;
      else if (!dueDateTime && updated.notificationId) {
        await cancelNotif(updated.notificationId);
        updated.notificationId = null;
      }
      setTodos((p) =>
        p.map((item) => (item.id === editingTodo.id ? updated : item)),
      );
    } else {
      if (Platform.OS !== "web") Vibration.vibrate(20);
      const newItem = {
        id: Date.now(),
        task,
        category,
        dueDateTime: dueDateTime || null,
        completed: false,
        createdAt: new Date().toISOString(),
        notificationId: null,
      };
      const nid = await scheduleNotif(newItem);
      if (nid) newItem.notificationId = nid;
      setTodos((p) => [newItem, ...p]);
    }
  };

  // ✅ Toggle complete ↔ incomplete
  const toggleComplete = async (id) => {
    const todo = todos.find((i) => i.id === id);
    if (!todo) return;
    const nowDone = !todo.completed;
    if (nowDone && todo.notificationId) {
      await cancelNotif(todo.notificationId);
      setTodos((p) =>
        p.map((i) =>
          i.id === id ? { ...i, completed: true, notificationId: null } : i,
        ),
      );
    } else {
      setTodos((p) =>
        p.map((i) => (i.id === id ? { ...i, completed: nowDone } : i)),
      );
      if (!nowDone && todo.dueDateTime && !isOverdue(todo.dueDateTime)) {
        const nid = await scheduleNotif({ ...todo, completed: false });
        setTodos((p) =>
          p.map((i) => (i.id === id ? { ...i, notificationId: nid } : i)),
        );
      }
    }
  };

  const deleteTodo = (id) => {
    confirmAction("Delete Task", "Remove this task?", async () => {
      if (Platform.OS !== "web") Vibration.vibrate(30);
      const todo = todos.find((i) => i.id === id);
      if (todo?.notificationId) await cancelNotif(todo.notificationId);
      setTodos((p) => p.filter((i) => i.id !== id));
    });
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = todos.filter((i) => i.category === cat);
    return acc;
  }, {});

  const totalCount = todos.length;
  const completedCount = todos.filter((i) => i.completed).length;
  const overdueCount = todos.filter(
    (i) => !i.completed && isOverdue(i.dueDateTime),
  ).length;

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: t.bg }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View
          style={[
            styles.headerCard,
            { backgroundColor: t.cardBg, borderColor: t.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: t.accentLight }]}>
              📝 My ToDo List
            </Text>
            {totalCount > 0 && (
              <Text style={[styles.headerSub, { color: t.textLight }]}>
                {completedCount} of {totalCount} complete
                {overdueCount > 0 ? `  ·  🔴 ${overdueCount} overdue` : ""}
              </Text>
            )}
          </View>
          <View style={styles.badges}>
            {totalCount > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: "rgba(168,85,247,0.15)",
                    borderColor: t.accent,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: t.accent }]}>
                  {totalCount}
                </Text>
              </View>
            )}
            {completedCount > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: "rgba(22,163,74,0.15)",
                    borderColor: "#16a34a",
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: "#16a34a" }]}>
                  ✓ {completedCount}
                </Text>
              </View>
            )}
            {overdueCount > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: "rgba(239,68,68,0.15)",
                    borderColor: "#ef4444",
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: "#ef4444" }]}>
                  🔴 {overdueCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ADD BUTTON */}
        <TouchableOpacity
          style={[styles.addFab, { backgroundColor: t.accent }]}
          onPress={openAdd}
          activeOpacity={0.8}
        >
          <Text style={styles.addFabText}>＋ Add New Task</Text>
        </TouchableOpacity>

        {/* CATEGORY CARDS */}
        {CATEGORIES.map((category) => {
          const items = grouped[category];
          const color = CATEGORY_COLORS[category];
          const doneCount = items.filter((i) => i.completed).length;
          const overdueIn = items.filter(
            (i) => !i.completed && isOverdue(i.dueDateTime),
          ).length;

          return (
            <View
              key={category}
              style={[
                styles.card,
                { backgroundColor: t.cardBg, borderColor: t.border },
              ]}
            >
              {/* Header */}
              <View style={[styles.catHeader, { borderBottomColor: t.border }]}>
                <View style={[styles.catDot, { backgroundColor: color }]} />
                <Text style={[styles.catTitle, { color }]}>
                  {CATEGORY_ICONS[category]} {category}
                </Text>
                {overdueIn > 0 && (
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#ef4444",
                    }}
                  >
                    🔴 {overdueIn}
                  </Text>
                )}
                {items.length > 0 && (
                  <Text
                    style={[
                      styles.catProgress,
                      {
                        color:
                          doneCount === items.length ? "#16a34a" : t.textLight,
                      },
                    ]}
                  >
                    {doneCount}/{items.length}
                  </Text>
                )}
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: `${color}22`, borderColor: color },
                  ]}
                >
                  <Text style={{ color, fontSize: 11, fontWeight: "800" }}>
                    {items.length}
                  </Text>
                </View>
              </View>

              {/* Mini progress */}
              {items.length > 0 && (
                <View style={[styles.miniBarBg, { backgroundColor: t.border }]}>
                  <View
                    style={[
                      styles.miniBarFill,
                      {
                        width: `${(doneCount / items.length) * 100}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
              )}

              {items.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={{ fontSize: 26 }}>📭</Text>
                  <Text style={[styles.emptyText, { color: t.textLight }]}>
                    No tasks yet
                  </Text>
                  <TouchableOpacity
                    onPress={openAdd}
                    style={[styles.emptyAddBtn, { borderColor: color }]}
                    activeOpacity={0.75}
                  >
                    <Text style={{ color, fontSize: 12, fontWeight: "700" }}>
                      ＋ Add {category} task
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.list}>
                  {items.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      accentColor={color}
                      t={t}
                      onToggle={() => toggleComplete(todo.id)}
                      onDelete={() => deleteTodo(todo.id)}
                      onEdit={() => openEdit(todo)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Modal */}
      <TaskModal
        visible={modalVisible}
        onClose={() => setModal(false)}
        onSave={handleSave}
        editingTodo={editingTodo}
        t={t}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 60, gap: 12 },

  // Header
  headerCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  headerSub: { fontSize: 12, marginTop: 3 },
  badges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },

  // FAB
  addFab: {
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  addFabText: {
    color: "#f9fafb",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Category card
  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  catDot: { width: 9, height: 9, borderRadius: 5 },
  catTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  catProgress: { fontSize: 12, fontWeight: "600" },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  miniBarBg: {
    height: 3,
    borderRadius: 999,
    marginBottom: 10,
    overflow: "hidden",
  },
  miniBarFill: { height: 3, borderRadius: 999 },
  emptyState: { alignItems: "center", paddingVertical: 18, gap: 6 },
  emptyText: { fontSize: 14, fontWeight: "600" },
  emptyAddBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    marginTop: 4,
  },

  // Todo item
  list: { gap: 8 },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 10,
  },
  // ✅ Checkbox — clear visual affordance for toggle
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  todoText: { fontSize: 13, fontWeight: "500", lineHeight: 20 },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  dueText: { fontSize: 11 },
  actions: { flexDirection: "column", gap: 5, flexShrink: 0 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  // Modal / sheet
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: "94%",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 18,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(148,163,184,0.4)",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  textArea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: "500",
    minHeight: 72,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  catChipSm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
  },

  // Reminder toggle row
  reminderToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  toggleBtn: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    position: "relative",
  },
  toggleCircle: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  // Reminder box
  reminderBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  dueLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  dueLabelText: { flex: 1, fontSize: 14, fontWeight: "700" },
  noDueHint: { fontSize: 13, marginBottom: 8, fontStyle: "italic" },
  subLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  // Time toggle button
  timeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    marginBottom: 6,
  },
  timeToggleText: { flex: 1, fontSize: 15, fontWeight: "700" },

  // Modal buttons
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
  saveBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#f9fafb", fontWeight: "800", fontSize: 15 },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelBtnText: { fontWeight: "700", fontSize: 14 },
});
