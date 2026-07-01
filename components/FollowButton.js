"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// status: "NONE" | "PENDING" | "ACCEPTED"
export default function FollowButton({ targetId, initialStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/users/${targetId}/follow`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setStatus(data.status);
      router.refresh(); // refresh follower counts + feed
    } else {
      const d = await res.json().catch(() => ({}));
      if (d.error) window.alert(d.error);
    }
  }

  const label = status === "ACCEPTED" ? "Following" : status === "PENDING" ? "Requested" : "Follow";
  const soft = status === "ACCEPTED" || status === "PENDING";

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        soft
          ? "rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          : "rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      }
    >
      {label}
    </button>
  );
}
