"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DisableUserBtn } from "@/components/AdminActions";
import { RoleSelect, GradeClassEditor, ParentLinker } from "@/components/AdminOnboarding";
import { RoleBadge, ClassBadge } from "@/components/Badge";

export default function AccountsPanel({ users, students, viewerId }) {
  const router = useRouter();
  const [checked, setChecked] = useState(new Set());
  const [bulkClass, setBulkClass] = useState("");
  const [busy, setBusy] = useState(false);

  function toggle(id) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkDisable(disabled) {
    if (checked.size === 0) return;
    setBusy(true);
    const res = await fetch("/api/admin/disable-user", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [...checked], disabled }),
    });
    setBusy(false);
    if (res.ok) { setChecked(new Set()); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || "Could not update accounts."); }
  }

  async function bulkSetClass() {
    if (checked.size === 0 || !bulkClass.trim()) return;
    setBusy(true);
    const res = await fetch("/api/admin/set-grade", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [...checked], gradeClass: bulkClass.trim() }),
    });
    setBusy(false);
    if (res.ok) { setChecked(new Set()); setBulkClass(""); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || "Could not set class."); }
  }

  return (
    <div>
      {checked.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand bg-brand/5 p-3 text-xs">
          <span className="font-semibold">{checked.size} selected</span>
          <button disabled={busy} onClick={() => bulkDisable(true)} className="rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white disabled:opacity-50">Disable</button>
          <button disabled={busy} onClick={() => bulkDisable(false)} className="rounded-md border border-gray-300 px-2.5 py-1 font-semibold text-gray-700 disabled:opacity-50">Enable</button>
          <input value={bulkClass} onChange={(e) => setBulkClass(e.target.value)} placeholder="Set class e.g. 6B"
            className="rounded-md border border-gray-300 px-2 py-1" />
          <button disabled={busy || !bulkClass.trim()} onClick={bulkSetClass} className="rounded-md bg-brand px-2.5 py-1 font-semibold text-white disabled:opacity-50">Apply class</button>
          <button onClick={() => setChecked(new Set())} className="ml-auto font-semibold text-gray-400 hover:text-gray-700">Clear</button>
        </div>
      )}
      <ul className="space-y-2">
        {users.map((u) => {
          const isSelf = u.id === viewerId;
          const children = u.childrenLinks.map((l) => l.child);
          return (
            <li key={u.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <div className="flex items-start gap-3">
                {!isSelf && (
                  <input type="checkbox" checked={checked.has(u.id)} onChange={() => toggle(u.id)} className="mt-1 h-4 w-4 shrink-0" aria-label={`Select ${u.name}`} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/u/${u.id}`} className="font-semibold hover:underline">{u.name}</Link>
                    <RoleBadge role={u.role} />
                    <ClassBadge gradeClass={u.gradeClass} />
                    {u.disabled && <span className="text-[11px] font-semibold text-red-600">disabled</span>}
                    {isSelf && <span className="text-[11px] text-gray-400">you</span>}
                  </div>
                  <p className="truncate text-xs text-gray-400">{u.email}</p>
                </div>
                {!isSelf && <DisableUserBtn userId={u.id} disabled={u.disabled} />}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RoleSelect userId={u.id} role={u.role} isSelf={isSelf} />
                <GradeClassEditor userId={u.id} gradeClass={u.gradeClass} />
              </div>

              {u.role === "PARENT" && (
                <ParentLinker parentId={u.id} students={students} children={children} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
