"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function ClubRequestRow({ clubId, user }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [handled, setHandled] = useState(false);
  if (handled) return null;

  async function act(action) {
    setBusy(true);
    const res = await fetch(`/api/clubs/${clubId}/requests/${user.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (res.ok) { setHandled(true); router.refresh(); }
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Link href={`/u/${user.id}`}><Avatar name={user.name} image={user.image} size={40} /></Link>
      <Link href={`/u/${user.id}`} className="flex-1 truncate text-sm font-medium hover:underline">{user.name}</Link>
      <button disabled={busy} onClick={() => act("accept")} className="shrink-0 rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">Accept</button>
      <button disabled={busy} onClick={() => act("decline")} className="shrink-0 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-600 disabled:opacity-50">Decline</button>
    </li>
  );
}
