"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClubJoinButton({ clubId, initialJoined }) {
  const router = useRouter();
  const [joined, setJoined] = useState(initialJoined);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/clubs/${clubId}/join`, { method: "POST" });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setJoined(d.joined); router.refresh(); }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        joined
          ? "rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          : "rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
      }
    >
      {joined ? "Joined" : "Join"}
    </button>
  );
}
