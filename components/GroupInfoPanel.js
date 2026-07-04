"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { X } from "@/components/icons";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function GroupInfoPanel({ conversationId, name, members, createdById, currentUserId, iAmGroupAdmin, onClose }) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState(members);

  useEffect(() => {
    function onKeyDown(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function rename() {
    const next = window.prompt(t("messages.groupInfo.renamePrompt"), name);
    if (!next || !next.trim() || next.trim() === name) return;
    setBusy(true);
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: next.trim() }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("messages.groupInfo.renameError")); }
  }

  async function setRole(userId, role) {
    setBusy(true);
    const res = await fetch(`/api/conversations/${conversationId}/members/${userId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }),
    });
    setBusy(false);
    if (res.ok) { setList((l) => l.map((m) => (m.id === userId ? { ...m, role } : m))); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("messages.groupInfo.roleError")); }
  }

  async function removeMember(userId) {
    if (!window.confirm(t("messages.groupInfo.removeConfirm"))) return;
    setBusy(true);
    const res = await fetch(`/api/conversations/${conversationId}/members/${userId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) { setList((l) => l.filter((m) => m.id !== userId)); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("messages.groupInfo.removeError")); }
  }

  async function leave() {
    if (!window.confirm(t("messages.groupInfo.leaveConfirm"))) return;
    setBusy(true);
    const res = await fetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push("/messages");
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("messages.groupInfo.leaveError")); }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold">{name}</h2>
          <button onClick={onClose} aria-label={t("messages.groupInfo.close")}><X /></button>
        </div>

        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-xs">
          {iAmGroupAdmin && <button disabled={busy} onClick={rename} className="font-semibold text-brand disabled:opacity-50">{t("messages.groupInfo.renameGroup")}</button>}
          {iAmGroupAdmin && (
            <Link href={`/messages/${conversationId}/add`} className="font-semibold text-brand">{t("messages.groupInfo.addPeople")}</Link>
          )}
          <button disabled={busy} onClick={leave} className="ml-auto font-semibold text-red-500 disabled:opacity-50">{t("messages.groupInfo.leaveGroup")}</button>
        </div>

        <ul className="divide-y divide-gray-100">
          {list.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/u/${m.id}`}><Avatar name={m.name} image={m.image} size={40} /></Link>
              <span className="min-w-0 flex-1">
                <Link href={`/u/${m.id}`} className="block truncate text-sm font-medium hover:underline">{m.name}</Link>
                {m.role === "ADMIN" && <span className="text-xs font-semibold text-brand">{t("messages.groupInfo.groupAdmin")}</span>}
              </span>
              {iAmGroupAdmin && m.id !== currentUserId && m.id !== createdById && (
                <div className="flex shrink-0 gap-2 text-xs">
                  {m.role === "ADMIN" ? (
                    <button disabled={busy} onClick={() => setRole(m.id, "MEMBER")} className="font-semibold text-gray-500 hover:text-brand disabled:opacity-50">{t("messages.groupInfo.removeAdmin")}</button>
                  ) : (
                    <button disabled={busy} onClick={() => setRole(m.id, "ADMIN")} className="font-semibold text-gray-500 hover:text-brand disabled:opacity-50">{t("messages.groupInfo.makeAdmin")}</button>
                  )}
                  <button disabled={busy} onClick={() => removeMember(m.id)} className="font-semibold text-red-500 hover:underline disabled:opacity-50">{t("messages.groupInfo.remove")}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
