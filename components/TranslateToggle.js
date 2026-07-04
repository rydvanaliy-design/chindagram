"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useAiEnabled } from "@/lib/useAiEnabled";

// A small "See translation" link under a caption/comment. Renders nothing
// when AI helpers aren't configured or there's no text to translate.
export default function TranslateToggle({ text }) {
  const { t, locale } = useT();
  const aiEnabled = useAiEnabled();
  const [translation, setTranslation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!aiEnabled || !text || !text.trim()) return null;

  async function toggle() {
    if (translation) { setTranslation(null); return; }
    setBusy(true);
    setError("");
    const res = await fetch("/api/ai/translate", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, target: locale }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setTranslation(d.translation);
    else setError(d.error || t("posts.card.translateError"));
  }

  return (
    <div className="mt-0.5">
      <button type="button" onClick={toggle} disabled={busy} className="text-xs font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-50">
        {busy ? t("common.actions.loading") : translation ? t("posts.card.seeOriginal") : t("posts.card.seeTranslation")}
      </button>
      {translation && <p className="mt-0.5 text-sm text-gray-700">{translation}</p>}
      {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
