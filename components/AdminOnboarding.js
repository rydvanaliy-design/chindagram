"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import { useT } from "@/lib/i18n/LocaleProvider";

function useApi(errorMessage) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function call(url, body) {
    setBusy(true);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      return true;
    }
    const data = await res.json().catch(() => ({}));
    window.alert(data.error || errorMessage);
    return false;
  }
  return { busy, call };
}

// School-wide "hold every post & comment for review" switch.
export function ApprovalToggle({ enabled }) {
  const { t } = useT();
  const { busy, call } = useApi(t("admin.actions.actionFailed"));
  return (
    <button
      onClick={() => call("/api/admin/settings", { requireApproval: !enabled })}
      disabled={busy}
      className={
        enabled
          ? "rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          : "rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-60"
      }
    >
      {enabled ? t("admin.moderation.on") : t("admin.moderation.off")}
    </button>
  );
}

// Per-account role dropdown.
export function RoleSelect({ userId, role, isSelf }) {
  const { t } = useT();
  const { busy, call } = useApi(t("admin.actions.actionFailed"));
  return (
    <select
      value={role}
      disabled={busy || isSelf}
      title={isSelf ? t("admin.accounts.roleSelfTitle") : t("admin.accounts.roleChangeTitle")}
      onChange={(e) => call("/api/admin/set-role", { userId, role: e.target.value })}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold disabled:opacity-60"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </select>
  );
}

// Per-account grade/class label editor.
export function GradeClassEditor({ userId, gradeClass }) {
  const { t } = useT();
  const { busy, call } = useApi(t("admin.actions.actionFailed"));
  const [value, setValue] = useState(gradeClass || "");
  const dirty = value.trim() !== (gradeClass || "");
  return (
    <div className="flex items-center gap-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("admin.accounts.gradeClassPlaceholder")}
        maxLength={40}
        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-xs"
      />
      <button
        onClick={() => call("/api/admin/set-grade", { userId, gradeClass: value })}
        disabled={busy || !dirty}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40"
      >
        {t("common.actions.save")}
      </button>
    </div>
  );
}

// Link a parent account to its child (Student) accounts, and unlink.
export function ParentLinker({ parentId, students, children }) {
  const { t } = useT();
  const { busy, call } = useApi(t("admin.actions.actionFailed"));
  const [childId, setChildId] = useState("");
  const linkedIds = new Set(children.map((c) => c.id));
  const options = students.filter((s) => s.id !== parentId && !linkedIds.has(s.id));

  return (
    <div className="mt-2 rounded-lg bg-gray-50 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-500">{t("admin.accounts.linkedChildren")}</p>
      {children.length === 0 ? (
        <p className="mb-2 text-xs text-gray-400">{t("admin.accounts.noChildrenLinked")}</p>
      ) : (
        <ul className="mb-2 space-y-1">
          {children.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-xs">
              <span>{c.name}</span>
              <button
                onClick={() => call("/api/admin/parent-link", { parentId, childId: c.id, action: "unlink" })}
                disabled={busy}
                className="font-semibold text-red-600 disabled:opacity-50"
              >
                {t("admin.accounts.unlink")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-1">
        <select
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
        >
          <option value="">{t("admin.accounts.addStudentPlaceholder")}</option>
          {options.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          onClick={() => childId && call("/api/admin/parent-link", { parentId, childId, action: "link" })}
          disabled={busy || !childId}
          className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          {t("admin.accounts.link")}
        </button>
      </div>
    </div>
  );
}
