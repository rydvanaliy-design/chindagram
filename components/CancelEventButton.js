"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelEventButton({ eventId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!window.confirm("Cancel this event? This can't be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push("/events");
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || "Could not cancel event."); }
  }

  return (
    <button onClick={cancel} disabled={busy} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
      Cancel event
    </button>
  );
}
