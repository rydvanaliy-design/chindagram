"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "@/components/icons";
import { useT } from "@/lib/i18n/LocaleProvider";

// Small "..." menu on someone else's profile: close friend, mute/unmute, block/unblock.
export default function ProfileMoreMenu({ targetId, initialBlocked, initialMuted, initialCloseFriend }) {
  const router = useRouter();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [muted, setMuted] = useState(initialMuted);
  const [closeFriend, setCloseFriend] = useState(initialCloseFriend);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function toggleBlock() {
    const verb = blocked ? t("profile.more.unblock") : t("profile.more.block");
    if (!window.confirm(`${t("profile.more.blockConfirm", { verb })}${!blocked ? t("profile.more.blockConfirmExtra") : ""}`)) return;
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
      <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label={t("profile.actions.moreOptions")}>
        <MoreHorizontal />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {!blocked && (
              <button onClick={toggleCloseFriend} disabled={busy} className="block w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60">
                {closeFriend ? t("profile.more.removeCloseFriend") : t("profile.more.addCloseFriend")}
              </button>
            )}
            {!blocked && (
              <button onClick={toggleMute} disabled={busy} className="block w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60">
                {muted ? t("profile.more.unmute") : t("profile.more.mute")}
              </button>
            )}
            <button onClick={toggleBlock} disabled={busy} className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-gray-50 disabled:opacity-60">
              {blocked ? t("profile.more.unblock") : t("profile.more.block")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
