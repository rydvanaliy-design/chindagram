// A small, on-brand set of playful profile accent themes.
// `band` colors the profile header strip; `chip` styles the selector swatch.

export const THEMES = {
  default: { label: "Navy", band: "from-brand to-brand", chip: "bg-brand" },
  gold:    { label: "Gold", band: "from-accent to-yellow-400", chip: "bg-accent" },
  sky:     { label: "Sky", band: "from-sky-400 to-blue-500", chip: "bg-sky-400" },
  rose:    { label: "Rose", band: "from-rose-400 to-pink-500", chip: "bg-rose-400" },
  mint:    { label: "Mint", band: "from-emerald-400 to-teal-500", chip: "bg-emerald-400" },
  violet:  { label: "Violet", band: "from-violet-400 to-purple-500", chip: "bg-violet-400" },
};

export const THEME_KEYS = Object.keys(THEMES);

export function themeOf(key) {
  return THEMES[key] || THEMES.default;
}
