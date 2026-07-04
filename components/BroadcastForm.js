"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BroadcastForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    if (!window.confirm("Send this announcement to every account on Chindagram?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }),
    });
    setBusy(false);
    if (res.ok) { setMessage(""); window.alert("Announcement sent to everyone."); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || "Could not send announcement."); }
  }

  return (
    <form onSubmit={send} className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
      <textarea
        value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={2000}
        placeholder="Write a school-wide announcement…"
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <button type="submit" disabled={!message.trim() || busy} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
        {busy ? "Sending…" : "Send to everyone"}
      </button>
    </form>
  );
}
