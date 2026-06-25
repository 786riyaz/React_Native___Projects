import { StyleSheet, Text, View } from "react-native";
import { CATEGORY_META } from "../config/activityConfig";

export default function CategoryPill({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META["Other / Custom"];
  return (
    <View style={[styles.pill, { backgroundColor: meta.color }]}>
      <Text style={styles.icon}>{meta.icon}</Text>
      <Text style={styles.text} numberOfLines={1}>
        {category}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 3,
    maxWidth: 160,
  },
  icon: { fontSize: 10 },
  text: {
    fontSize: 9,
    fontWeight: "600",
    color: "#f9fafb",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
