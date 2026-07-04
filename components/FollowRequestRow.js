"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function FollowRequestRow({ requestId, user }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [handled, setHandled] = useState(false);

  async function respond(action) {
    setBusy(true);
    const res = await fetch(`/api/follow-requests/${requestId}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (res.ok) { setHandled(true); router.refresh(); }
  }

  if (handled) return null;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Link href={`/u/${user.id}`}><Avatar name={user.name} image={user.image} size={44} /></Link>
      <div className="min-w-0 flex-1">
        <Link href={`/u/${user.id}`} className="block truncate text-sm font-semibold hover:underline">{user.name}</Link>
        {user.username && <p className="truncate text-xs text-gray-400">@{user.username}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <button onClick={() => respond("accept")} disabled={busy} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{t("notifications.requests.confirm")}</button>
        <button onClick={() => respond("decline")} disabled={busy} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-60">{t("notifications.requests.delete")}</button>
      </div>
    </li>
  );
}
