import { ROLE_LABELS } from "@/lib/roles";

// Small role + class badges shown next to a name.
// Teacher/Admin get the gold accent; Student/Parent stay quiet navy.

const ROLE_STYLE = {
  ADMIN: "bg-accent/40 text-brand",
  TEACHER: "bg-accent/30 text-brand",
  PARENT: "bg-brand/10 text-brand",
  STUDENT: "bg-gray-100 text-gray-600",
};

export function RoleBadge({ role }) {
  const label = ROLE_LABELS[role];
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
