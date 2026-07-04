"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

// status: "NONE" | "REQUESTED" (I asked them) | "PENDING_THEM" (they asked me) | "FRIENDS"
export default function FriendButton({ targetId, initialStatus }) {
  const router = useRouter();
  const { t } = useT();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  async function act() {
    if (status === "FRIENDS" && !window.confirm(t("profile.friend.removeConfirm"))) return;
    setBusy(true);
    const res = await fetch(`/api/users/${targetId}/friend`, { method: "POST" });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setStatus(d.status); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); if (d.error) window.alert(d.error); }
  }

  const label = {
    FRIENDS: t("profile.friend.friends"),
    REQUESTED: t("profile.friend.cancelRequest"),
    PENDING_THEM: t("profile.friend.confirmFriend"),
    NONE: t("profile.friend.addFriend"),
  }[status] || t("profile.friend.addFriend");

  return (
    <button
      onClick={act}
      disabled={busy}
      className={
        status === "PENDING_THEM"
          ? "rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          : "rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      }
    >
      {label}
    </button>
  );
}
