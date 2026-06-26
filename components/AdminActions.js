"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run(url, body) {
    setBusy(true);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else window.alert("Action failed.");
  }
  return { busy, run };
}

export function RemovePostBtn({ postId }) {
  const { busy, run } = useAction();
  return (
    <button onClick={() => run("/api/admin/remove-post", { postId })} disabled={busy}
      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
      Remove post
    </button>
  );
}

export function RemoveCommentBtn({ commentId }) {
  const { busy, run } = useAction();
  return (
    <button onClick={() => run("/api/admin/remove-comment", { commentId })} disabled={busy}
      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
      Remove comment
    </button>
  );
}

export function DisableUserBtn({ userId, disabled }) {
  const { busy, run } = useAction();
  return (
    <button onClick={() => run("/api/admin/disable-user", { userId, disabled: !disabled })} disabled={busy}
      className={
        disabled
          ? "rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-60"
          : "rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
      }>
      {disabled ? "Enable" : "Disable"}
    </button>
  );
}

export function RemoveMessageBtn({ messageId }) {
  const { busy, run } = useAction();
  return (
    <button onClick={() => run("/api/admin/remove-message", { messageId })} disabled={busy}
      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
      Remove message
    </button>
  );
}
