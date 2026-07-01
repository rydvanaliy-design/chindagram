// A small built-in GIF set for comments (Confirmed: "via a provider key or a
// small built-in set; moderated"). No provider key configured, so these are
// genuine small local animations — not fetched from anywhere external.
export const BUILTIN_GIFS = [
  { key: "heart", url: "/gifs/heart.gif", label: "Heart" },
  { key: "star", url: "/gifs/star.gif", label: "Yay" },
  { key: "thumbsup", url: "/gifs/thumbsup.gif", label: "Thumbs up" },
  { key: "clap", url: "/gifs/clap.gif", label: "Clap" },
  { key: "party", url: "/gifs/party.gif", label: "Party" },
];

export function isBuiltinGif(url) {
  return BUILTIN_GIFS.some((g) => g.url === url);
}
