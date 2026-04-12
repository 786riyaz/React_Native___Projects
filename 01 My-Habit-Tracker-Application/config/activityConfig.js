export const CATEGORY_META = {
  Salah: { icon: "🕌", color: "#7c3aed" },
  Health: { icon: "🏋", color: "#16a34a" },
  "Islamic Learning": { icon: "📖", color: "#0ea5e9" },
  Programming: { icon: "💻", color: "#4f46e5" },
  Work: { icon: "💼", color: "#7c3aed" },
  Learning: { icon: "🎓", color: "#0ea5e9" },
  Aptitude: { icon: "🧠", color: "#eab308" },
  "English / Interview": { icon: "🎙", color: "#ec4899" },
  "Family & Social": { icon: "👨‍👩‍👧", color: "#06b6d4" },
  "Life Skills": { icon: "🚗", color: "#22c55e" },
  Personal: { icon: "🙋", color: "#64748b" },
  "Reflection / Night": { icon: "🌙", color: "#475569" },
  "Other / Custom": { icon: "🧩", color: "#9ca3af" },
};

export const CATEGORY_ORDER = [
  "Salah",
  "Health",
  "Islamic Learning",
  "Programming",
  "Learning",
  "Work",
  "Aptitude",
  "English / Interview",
  "Family & Social",
  "Life Skills",
  "Personal",
  "Reflection / Night",
  "Other / Custom",
];

export const DEFAULT_DAILY = {
  "Fajr Salah": { time: "05:30", category: "Salah" },
  "Gym Workout (30 min)": { time: "05:50", category: "Health" },
  "Quran Recitation (15 min)": { time: "06:20", category: "Islamic Learning" },
  "Breakfast & Freshen Up": { time: "06:35", category: "Personal" },
  "Car Driving Practice": { time: "06:30", category: "Life Skills" },
  "Technical Learning": { time: "07:00", category: "Learning" },
  "Islamic Studies": { time: "07:30", category: "Islamic Learning" },
  "Reflection Journaling": { time: "08:00", category: "Reflection / Night" },
  "Flexible Learning / Creative Practice / Programming": {
    time: "08:15",
    category: "Programming",
  },
  "Work Preparation": { time: "09:30", category: "Work" },
  "Work Session 1": { time: "10:00", category: "Work" },
  "Short Break": { time: "11:30", category: "Personal" },
  "Dhuhr Salah": { time: "13:30", category: "Salah" },
  "Lunch Break": { time: "13:40", category: "Personal" },
  "Qailulah (Power Nap)": { time: "14:30", category: "Health" },
  "Work Session 2": { time: "15:00", category: "Work" },
  "Short Break (Stretch)": { time: "16:00", category: "Health" },
  "Asr Salah": { time: "17:30", category: "Salah" },
  "Work Session 3": { time: "17:30", category: "Work" },
  "Maghrib Salah": { time: "19:30", category: "Salah" },
  "Creative Problem Solving / Reading": { time: "19:50", category: "Learning" },
  "Isha Salah": { time: "21:00", category: "Salah" },
  "Family / Social Time": { time: "21:10", category: "Family & Social" },
  "Quran Reflection": { time: "21:45", category: "Islamic Learning" },
  "Wind Down & Sleep": { time: "22:00", category: "Reflection / Night" },
};

export const DEFAULT_DAILY_NAMES = Object.keys(DEFAULT_DAILY);
export const DEFAULT_DAILY_SET = new Set(DEFAULT_DAILY_NAMES);

export const DEFAULT_WEEKLY = {
  "Programming Technology + English Grammar": {
    category: "Programming",
    days: ["Mon"],
  },
  "Aptitude Practice + Mock Interviews": {
    category: "Aptitude",
    days: ["Tue"],
  },
  "Programming Concepts (New Tech) + Vocabulary": {
    category: "Programming",
    days: ["Wed"],
  },
  "Aptitude Tests + Speaking Practice": { category: "Aptitude", days: ["Thu"] },
  "Programming Projects + Jumu'ah & Islamic Studies": {
    category: "Programming",
    days: ["Fri"],
  },
  "English Mock Interviews + Programming Revision": {
    category: "English / Interview",
    days: ["Sat"],
  },
  "Family & Friends + Planning": { category: "Family & Social", days: ["Sun"] },
  "Habit Tracking Review": { category: "Reflection / Night", days: ["Sun"] },
  "Diverse Content (Podcast / Book)": { category: "Learning", days: ["Sun"] },
  "Networking / Developer Community": { category: "Work", days: ["Sun"] },
};

export const DEFAULT_WEEKLY_ITEMS = Object.entries(DEFAULT_WEEKLY).map(
  ([name, v]) => ({ name, days: v.days || [] }),
);
export const DEFAULT_WEEKLY_SET = new Set(Object.keys(DEFAULT_WEEKLY));

export function formatTimeLabel(time24) {
  if (!time24) return "";
  const [hStr, mStr = "00"] = time24.split(":");
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const hh = String(h12).padStart(2, "0");
  return `${hh}:${mStr} ${ampm}`;
}

export function getDailyMeta(name, customMeta = {}) {
  const custom = customMeta[name];
  if (custom) {
    const time = custom.time || "";
    return {
      category: custom.category || "Other / Custom",
      time,
      timeLabel: formatTimeLabel(time),
      sortKey: time || "99:99",
    };
  }
  const def = DEFAULT_DAILY[name];
  if (def) {
    const time = def.time || "";
    return {
      category: def.category || "Other / Custom",
      time,
      timeLabel: formatTimeLabel(time),
      sortKey: time || "99:99",
    };
  }
  return {
    category: "Other / Custom",
    time: "",
    timeLabel: "",
    sortKey: "99:99",
  };
}

export function getWeeklyMeta(name) {
  const def = DEFAULT_WEEKLY[name];
  return {
    category: def?.category || "Other / Custom",
    time: "",
    timeLabel: "",
  };
}
