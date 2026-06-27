"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Approve / Remove buttons for a held or reported post/comment.
export function ReviewActions({ type, id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action) {
    if (action === "remove" && !window.confirm("Remove this for everyone?")) return;
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
      window.alert(d.error || "Action failed.");
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button onClick={() => act("approve")} disabled={busy}
        className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
        Approve
      </button>
      <button onClick={() => act("remove")} disabled={busy}
        className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
        Remove
      </button>
    </div>
  );
}
