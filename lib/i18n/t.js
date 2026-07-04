import { dictionaries } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

export function getDictionary(locale) {
  return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}

// key looks like "namespace.some.nested.key". Falls back to the key itself
// (not a crash) so a missing translation is visible instead of breaking the page.
export function translate(dict, key, params) {
  const parts = key.split(".");
  let value = dict;
  for (const part of parts) value = value?.[part];
  if (typeof value !== "string") return key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, name) => (params[name] ?? ""));
}

// Bind a dictionary once per request/render so callers just do t("posts.title").
export function makeT(locale) {
  const dict = getDictionary(locale);
  return (key, params) => translate(dict, key, params);
}
