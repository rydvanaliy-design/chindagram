"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

// Two-way pill toggle (ไทย / English). Used in Settings and on the logged-out
// auth pages (login/register/join) so language can be picked before signing in.
export default function LanguageSwitch({ className = "" }) {
  const router = useRouter();
  const { locale, t } = useT();
  const [busy, setBusy] = useState(false);

  async function switchTo(next) {
    if (next === locale || busy) return;
    setBusy(true);
    const res = await fetch("/api/settings/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={t("common.language.label")}
      className={`inline-flex overflow-hidden rounded-lg border border-gray-300 text-sm font-semibold ${className}`}
    >
      <button
        type="button"
        onClick={() => switchTo("th")}
        aria-pressed={locale === "th"}
        disabled={busy}
        className={`px-3 py-1.5 ${locale === "th" ? "bg-brand text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
      >
        {t("common.language.thai")}
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={locale === "en"}
        disabled={busy}
        className={`px-3 py-1.5 ${locale === "en" ? "bg-brand text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
      >
        {t("common.language.english")}
      </button>
    </div>
  );
}
