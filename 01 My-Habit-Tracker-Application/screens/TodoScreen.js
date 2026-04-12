// screens/TodoScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
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

function TodoItem({ todo, onToggle, onDelete, accentColor, t }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    if (Platform.OS !== "web") Vibration.vibrate(25);
    // Subtle bounce animation on toggle
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

  return (
    // ✅ Full row is tappable (toggle), delete is separate
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.todoItem,
          {
            backgroundColor: todo.completed
              ? "rgba(22,163,74,0.10)"
              : t.checkRowBg,
            borderColor: todo.completed
              ? "rgba(22,163,74,0.35)"
              : t.checkRowBorder,
            borderLeftColor: accentColor,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {/* Checkbox */}
        <View
          style={[
            styles.todoCheckbox,
            {
              borderColor: todo.completed ? "#16a34a" : accentColor,
              backgroundColor: todo.completed ? "#16a34a" : "transparent",
            },
          ]}
        >
          {todo.completed && (
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "900" }}>
              ✓
            </Text>
          )}
        </View>

        {/* Task text — tapping anywhere on row toggles */}
        <Text
          style={[
            styles.todoText,
            { color: t.text },
            todo.completed && {
              textDecorationLine: "line-through",
              color: t.textLight,
              opacity: 0.65,
            },
          ]}
          numberOfLines={4}
        >
          {todo.task}
        </Text>

        {/* Delete — separate touch so it doesn't conflict with row toggle */}
        <TouchableOpacity
          onPress={onDelete}
          style={[
            styles.deleteBtn,
            {
              backgroundColor: "rgba(239,68,68,0.12)",
              borderColor: "rgba(239,68,68,0.35)",
            },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.5}
        >
          <Text style={{ color: "#ef4444", fontSize: 16, fontWeight: "700" }}>
            ✕
          </Text>
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

export default function TodoScreen() {
  const { themeObj } = useApp();
  const t = themeObj;

  const [todos, setTodos] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Learning");
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setTodos(JSON.parse(stored));
      })
      .catch(console.error)
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos)).catch(
      console.error,
    );
  }, [todos, isLoaded]);

  const addTodo = () => {
    if (!taskInput.trim()) return;
    if (Platform.OS !== "web") Vibration.vibrate(20);
    setTodos((prev) => [
      {
        id: Date.now(),
        task: taskInput.trim(),
        category: categoryInput,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setTaskInput("");
    inputRef.current?.focus();
  };

  const deleteTodo = (id) => {
    confirmAction("Delete Task", "Remove this task?", () => {
      if (Platform.OS !== "web") Vibration.vibrate(30);
      setTodos((prev) => prev.filter((item) => item.id !== id));
    });
  };

  const toggleComplete = (id) => {
    setTodos((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const groupedTodos = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = todos.filter((item) => item.category === cat);
    return acc;
  }, {});

  const completedCount = todos.filter((item) => item.completed).length;
  const totalCount = todos.length;

  return (
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
        <View>
          <Text style={[styles.cardTitle, { color: t.accentLight }]}>
            📝 My ToDo List
          </Text>
          {totalCount > 0 && (
            <Text style={[styles.headerSub, { color: t.textLight }]}>
              {completedCount} of {totalCount} tasks complete
            </Text>
          )}
        </View>
        <View style={styles.headerBadges}>
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
        </View>
      </View>

      {/* INPUT CARD */}
      <View
        style={[
          styles.card,
          { backgroundColor: t.cardBg, borderColor: t.border },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: t.inputBg,
              color: t.inputText,
              borderColor: t.border,
            },
          ]}
          placeholder="What do you need to do?"
          placeholderTextColor={t.textLight}
          value={taskInput}
          onChangeText={setTaskInput}
          onSubmitEditing={addTodo}
          returnKeyType="done"
        />

        {/* Category selector — tap to pick */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
        >
          <View style={styles.catRow}>
            {CATEGORIES.map((cat) => {
              const active = categoryInput === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategoryInput(cat)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: active
                        ? CATEGORY_COLORS[cat]
                        : t.inputBg,
                      borderColor: active ? CATEGORY_COLORS[cat] : t.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 14 }}>{CATEGORY_ICONS[cat]}</Text>
                  <Text
                    style={[
                      styles.catChipText,
                      { color: active ? "#fff" : t.text },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: t.accent }]}
          onPress={addTodo}
          activeOpacity={0.75}
        >
          <Text style={styles.addBtnText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* CATEGORY CARDS */}
      {CATEGORIES.map((category) => {
        const items = groupedTodos[category];
        const color = CATEGORY_COLORS[category];
        const doneCount = items.filter((i) => i.completed).length;

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
              <Text style={[styles.catTitle, { color: color }]}>
                {CATEGORY_ICONS[category]} {category}
              </Text>
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

            {/* Mini progress bar */}
            {items.length > 0 && (
              <View
                style={[styles.miniProgressBg, { backgroundColor: t.border }]}
              >
                <View
                  style={[
                    styles.miniProgressFill,
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
                <Text style={[styles.emptyHint, { color: t.textLight }]}>
                  Tap above to add a {category.toLowerCase()} task
                </Text>
              </View>
            ) : (
              <View style={styles.todoList}>
                {items.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    accentColor={color}
                    t={t}
                    onToggle={() => toggleComplete(todo.id)}
                    onDelete={() => deleteTodo(todo.id)}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 50, gap: 12 },

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
  headerSub: { fontSize: 12, marginTop: 2 },
  headerBadges: { flexDirection: "row", gap: 6 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },

  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    fontSize: 14,
    fontWeight: "500",
  },
  catRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  catChipText: { fontSize: 12, fontWeight: "700" },
  addBtn: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  addBtnText: {
    color: "#f9fafb",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
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

  miniProgressBg: {
    height: 3,
    borderRadius: 999,
    marginBottom: 10,
    overflow: "hidden",
  },
  miniProgressFill: { height: 3, borderRadius: 999 },

  emptyState: { alignItems: "center", paddingVertical: 20, gap: 4 },
  emptyText: { fontSize: 14, fontWeight: "600" },
  emptyHint: { fontSize: 11, opacity: 0.7 },

  todoList: { gap: 7 },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 10,
  },
  todoCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  todoText: { flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 20 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
});
