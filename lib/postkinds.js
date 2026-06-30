// Single source of truth for post kinds and school categories.

// Format/media kind of a post.
export const KINDS = ["PHOTO", "REEL", "TEXT", "LINK", "POLL", "AUDIO", "DOCUMENT"];

// School content types (Teacher/Admin only). NONE = an ordinary post.
export const CATEGORIES = ["NONE", "ANNOUNCEMENT", "ACHIEVEMENT", "TIMETABLE", "LOSTFOUND"];

export const CATEGORY_LABELS = {
  ANNOUNCEMENT: "📣 Announcement",
  ACHIEVEMENT: "🏆 Achievement",
  TIMETABLE: "🗓️ Timetable",
  LOSTFOUND: "🧦 Lost & Found",
};

export function isKind(v) {
  return KINDS.includes(v);
}

export function isCategory(v) {
  return CATEGORIES.includes(v);
}

// School categories are restricted to Teacher/Admin (set server-side).
export function isSchoolCategory(v) {
  return v && v !== "NONE" && CATEGORIES.includes(v);
}
