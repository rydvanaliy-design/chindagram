"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function ClubAdminRow({ club }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  if (removed) return null;

  async function rename() {
    const name = window.prompt(t("clubs.admin.renamePrompt"), club.name);
    if (!name || !name.trim() || name.trim() === club.name) return;
    setBusy(true);
    const res = await fetch(`/api/clubs/${club.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("clubs.admin.renameError")); }
  }

  async function remove() {
    if (!window.confirm(t("clubs.admin.deleteConfirm", { name: club.name }))) return;
    setBusy(true);
    const res = await fetch(`/api/clubs/${club.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) setRemoved(true);
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("clubs.admin.deleteError")); }
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm">
      <div className="min-w-0">
        <Link href={`/clubs/${club.id}`} className="font-semibold hover:underline">{club.name}</Link>
        <p className="truncate text-xs text-gray-400">
          {t(club.memberCount === 1 ? "clubs.admin.startedByOne" : "clubs.admin.startedByOther", { name: club.createdBy.name, count: club.memberCount })}
        </p>
      </div>
      <div className="flex shrink-0 gap-2 text-xs">
        <button disabled={busy} onClick={rename} className="rounded-md border border-gray-300 px-2.5 py-1 font-semibold text-gray-700 disabled:opacity-50">{t("clubs.admin.rename")}</button>
        <button disabled={busy} onClick={remove} className="rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white disabled:opacity-50">{t("clubs.admin.delete")}</button>
      </div>
    </li>
  );
}
