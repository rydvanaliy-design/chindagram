"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

const OPTION_KEYS = [
  { key: "GOING", labelKey: "events.rsvp.going" },
  { key: "INTERESTED", labelKey: "events.rsvp.interested" },
  { key: "NOT_GOING", labelKey: "events.rsvp.notGoing" },
];

export default function EventRSVPButtons({ eventId, initialStatus }) {
  const router = useRouter();
  const { t } = useT();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  async function pick(key) {
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: key }),
    });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setStatus(d.status); router.refresh(); }
  }

  return (
    <div className="flex gap-2">
      {OPTION_KEYS.map((o) => (
        <button
          key={o.key} disabled={busy} onClick={() => pick(o.key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
            status === o.key ? "bg-brand text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {t(o.labelKey)}
        </button>
      ))}
    </div>
  );
}
