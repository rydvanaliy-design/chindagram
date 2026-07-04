"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function CancelEventButton({ eventId }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!window.confirm(t("events.cancel.confirm"))) return;
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push("/events");
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("events.cancel.error")); }
  }

  return (
    <button onClick={cancel} disabled={busy} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
      {t("events.cancel.button")}
    </button>
  );
}
