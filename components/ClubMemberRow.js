"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { RoleBadge } from "@/components/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function ClubMemberRow({ clubId, member, iAmAdmin, isCreator, currentUserId }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [role, setRoleState] = useState(member.role);
  const { user } = member;
  if (removed) return null;

  async function setRole(newRole) {
    setBusy(true);
    const res = await fetch(`/api/clubs/${clubId}/members/${user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }),
    });
    setBusy(false);
    if (res.ok) { setRoleState(newRole); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("clubs.member.roleUpdateError")); }
  }

  async function remove() {
    if (!window.confirm(t("clubs.member.removeConfirm", { name: user.name }))) return;
    setBusy(true);
    const res = await fetch(`/api/clubs/${clubId}/members/${user.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) { setRemoved(true); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("clubs.member.removeError")); }
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Link href={`/u/${user.id}`}><Avatar name={user.name} image={user.image} size={40} /></Link>
      <span className="min-w-0 flex-1">
        <Link href={`/u/${user.id}`} className="block truncate text-sm font-medium hover:underline">{user.name}</Link>
        {role === "ADMIN" && <span className="text-xs font-semibold text-brand">{t("clubs.detail.clubAdminLabel")}</span>}
      </span>
      <RoleBadge role={user.role} />
      {iAmAdmin && user.id !== currentUserId && !isCreator && (
        <div className="flex shrink-0 gap-2 text-xs">
          {role === "ADMIN" ? (
            <button disabled={busy} onClick={() => setRole("MEMBER")} className="font-semibold text-gray-500 hover:text-brand disabled:opacity-50">{t("clubs.member.removeAdmin")}</button>
          ) : (
            <button disabled={busy} onClick={() => setRole("ADMIN")} className="font-semibold text-gray-500 hover:text-brand disabled:opacity-50">{t("clubs.member.makeAdmin")}</button>
          )}
          <button disabled={busy} onClick={remove} className="font-semibold text-red-500 hover:underline disabled:opacity-50">{t("clubs.member.remove")}</button>
        </div>
      )}
    </li>
  );
}
