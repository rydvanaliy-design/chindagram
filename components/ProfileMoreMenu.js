"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "@/components/icons";

// Small "..." menu on someone else's profile: close friend, mute/unmute, block/unblock.
export default function ProfileMoreMenu({ targetId, initialBlocked, initialMuted, initialCloseFriend }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [muted, setMuted] = useState(initialMuted);
  const [closeFriend, setCloseFriend] = useState(initialCloseFriend);
  const [busy, setBusy] = useState(false);

  async function toggleBlock() {
    const verb = blocked ? "Unblock" : "Block";
    if (!window.confirm(`${verb} this account?${!blocked ? " You'll stop following each other and can't message or comment on each other." : ""}`)) return;
    setBusy(true);
    const res = await fetch(`/api/users/${targetId}/block`, { method: "POST" });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setBlocked(d.blocked); setOpen(false); router.refresh(); }
  }

  async function toggleMute() {
    setBusy(true);
    const res = await fetch(`/api/users/${targetId}/mute`, { method: "POST" });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setMuted(d.muted); setOpen(false); }
  }

  async function toggleCloseFriend() {
    setBusy(true);
    const res = await fetch(`/api/users/${targetId}/close-friend`, { method: "POST" });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setCloseFriend(d.closeFriend); setOpen(false); }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="More options">
        <MoreHorizontal />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {!blocked && (
              <button onClick={toggleCloseFriend} disabled={busy} className="block w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60">
                {closeFriend ? "★ Remove close friend" : "☆ Add to close friends"}
              </button>
            )}
            {!blocked && (
              <button onClick={toggleMute} disabled={busy} className="block w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60">
                {muted ? "Unmute" : "Mute"}
              </button>
            )}
            <button onClick={toggleBlock} disabled={busy} className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-gray-50 disabled:opacity-60">
              {blocked ? "Unblock" : "Block"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
