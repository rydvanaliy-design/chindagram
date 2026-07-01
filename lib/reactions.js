// Multiple post reactions (Confirmed: keep them wholesome/family-friendly).
// One reaction per user per post — picking a new one replaces the old one.

export const REACTIONS = ["HEART", "LAUGH", "THUMBSUP", "PARTY", "CLAP"];

export const REACTION_EMOJI = {
  HEART: "❤️",
  LAUGH: "😂",
  THUMBSUP: "👍",
  PARTY: "🎉",
  CLAP: "👏",
};

export const DEFAULT_REACTION = "HEART";

export function isReaction(v) {
  return REACTIONS.includes(v);
}
