import { requireApproval } from "@/lib/settings";

// Automated content filter (Confirmed decision #2). Anything flagged here is
// held as PENDING for a teacher/admin to review before it goes public.
//
// This is a deliberately simple, family-friendly banned-words list — it errs
// toward holding for review (a human always makes the final call). Edit the
// list below to tune it for the school.

const BANNED_WORDS = [
  // Profanity / slurs (kept minimal and non-graphic in source).
  "fuck", "shit", "bitch", "bastard", "asshole", "dick", "piss", "cunt",
  "slut", "whore", "faggot", "nigger", "retard",
  // Safety-sensitive terms worth a human glance in a school setting.
  "kill yourself", "kys", "suicide", "self harm", "selfharm",
];

// Build word-boundary regexes once so "class" doesn't match "ass", etc.
// Multi-word phrases match as a whole phrase.
const BANNED_PATTERNS = BANNED_WORDS.map((w) => ({
  word: w,
  re: new RegExp(`(?:^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9])`, "i"),
}));

// Returns { flagged, reason } for a piece of text.
export function screenText(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return { flagged: false, reason: null };
  for (const { word, re } of BANNED_PATTERNS) {
    if (re.test(t)) return { flagged: true, reason: `Matched filtered word: “${word}”` };
  }
  return { flagged: false, reason: null };
}

// Image/video content scanning needs an external vision service (a paid API).
// That isn't wired up yet, so this is an honest no-op hook: photos pass the
// automated stage but are still reportable, removable, and held when the
// school-wide approval switch is on. Plug a real check in here later.
export function screenImage(/* url */) {
  return { flagged: false, reason: null };
}

// Decide the initial status for new text content (caption or comment).
// PENDING => held for review; VISIBLE => goes public immediately.
export async function decideTextStatus(text) {
  if (await requireApproval()) {
    return { status: "PENDING", flagReason: "School-wide approval is on — all content is held for review." };
  }
  const { flagged, reason } = screenText(text);
  return flagged
    ? { status: "PENDING", flagReason: reason }
    : { status: "VISIBLE", flagReason: null };
}
