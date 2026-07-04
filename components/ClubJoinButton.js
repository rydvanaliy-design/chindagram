"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

const LABEL_KEY = { NONE: "clubs.join.join", PENDING: "clubs.join.requested", ACCEPTED: "clubs.join.joined" };

export default function ClubJoinButton({ clubId, initialStatus }) {
  const router = useRouter();
  const { t } = useT();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/clubs/${clubId}/join`, { method: "POST" });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setStatus(d.status); router.refresh(); }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        status === "NONE"
          ? "rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
          : "rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      }
    >
      {t(LABEL_KEY[status] || "clubs.join.join")}
    </button>
  );
}
