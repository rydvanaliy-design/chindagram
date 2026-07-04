"use client";
import { ROLE_LABELS } from "@/lib/roles";
import { useT } from "@/lib/i18n/LocaleProvider";

// Small role + class badges shown next to a name.
// Teacher/Admin get the gold accent; Student/Parent stay quiet navy.
// Client component so it can call useT() even though it's also rendered
// from server-component trees (e.g. app/u/[id]/page.js) — a server
// component can render a client leaf like this one without issue.

const ROLE_STYLE = {
  ADMIN: "bg-accent/40 text-brand",
  TEACHER: "bg-accent/30 text-brand",
  PARENT: "bg-brand/10 text-brand",
  STUDENT: "bg-gray-100 text-gray-600",
};

const ROLE_KEY = {
  ADMIN: "common.roles.admin",
  TEACHER: "common.roles.teacher",
  PARENT: "common.roles.parent",
  STUDENT: "common.roles.student",
};

export function RoleBadge({ role }) {
  const { t } = useT();
  const label = ROLE_LABELS[role] ? t(ROLE_KEY[role]) : null;
  if (!label) return null;
  // Student is the unremarkable default — no badge, keeps the UI calm.
  if (role === "STUDENT") return null;
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${ROLE_STYLE[role] || ROLE_STYLE.STUDENT}`}>
      {label}
    </span>
  );
}

export function ClassBadge({ gradeClass }) {
  if (!gradeClass) return null;
  return (
    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600">
      {gradeClass}
    </span>
  );
}

// Convenience: role + class together, in the order we usually show them.
export function Badges({ role, gradeClass }) {
  return (
    <>
      <RoleBadge role={role} />
      <ClassBadge gradeClass={gradeClass} />
    </>
  );
}
