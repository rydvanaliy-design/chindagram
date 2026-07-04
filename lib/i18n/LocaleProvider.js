"use client";
import { createContext, useContext, useMemo } from "react";
import { makeT } from "@/lib/i18n/t";

const LocaleContext = createContext({ locale: "th", t: (key) => key });

export function LocaleProvider({ locale, children }) {
  const value = useMemo(() => ({ locale, t: makeT(locale) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

// Client components: const { t, locale } = useT();
export function useT() {
  return useContext(LocaleContext);
}
