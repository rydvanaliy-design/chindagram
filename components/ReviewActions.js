"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

// Approve / Remove buttons for a held or reported post/comment.
export function ReviewActions({ type, id }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  async function act(action) {
    if (action === "remove" && !window.confirm(t("review.actions.removeConfirm"))) return;
    setBusy(true);
    const res = await fetch("/api/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, action }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      window.alert(d.error || t("review.actions.actionFailed"));
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button onClick={() => act("approve")} disabled={busy} aria-label={t("review.actions.approveAria")}
        className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
        {t("review.actions.approve")}
      </button>
      <button onClick={() => act("remove")} disabled={busy} aria-label={t("review.actions.removeAria")}
        className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
        {t("review.actions.remove")}
      </button>
    </div>
  );
}
