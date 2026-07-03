"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { key: "GOING", label: "Going" },
  { key: "INTERESTED", label: "Interested" },
  { key: "NOT_GOING", label: "Can't go" },
];

export default function EventRSVPButtons({ eventId, initialStatus }) {
  const router = useRouter();
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
      {OPTIONS.map((o) => (
        <button
          key={o.key} disabled={busy} onClick={() => pick(o.key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
            status === o.key ? "bg-brand text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
