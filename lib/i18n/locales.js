export const LOCALES = ["th", "en"];
export const DEFAULT_LOCALE = "th";

export function isLocale(value) {
  return LOCALES.includes(value);
}
