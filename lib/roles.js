// Roles used across Chindagram. Keep this the single source of truth.
// STUDENT is the default for anyone who signs up.
// Admins assign PARENT / TEACHER / ADMIN afterward (never self-selected).

export const ROLES = ["STUDENT", "PARENT", "TEACHER", "ADMIN"];

// Human-friendly label for a role badge.
export const ROLE_LABELS = {
  STUDENT: "Student",
  PARENT: "Parent",
  TEACHER: "Teacher",
  ADMIN: "Admin",
};

export function isRole(value) {
  return ROLES.includes(value);
}

// Teacher and Admin accounts are always public (Confirmed decision #1).
export function isStaff(role) {
  return role === "TEACHER" || role === "ADMIN";
}

// Full moderation (remove anything, disable accounts) is admin-only.
export function isAdmin(role) {
  return role === "ADMIN";
}

// Content authority (news, events, clubs, post review) — teachers and admins.
export function canModerateContent(role) {
  return role === "TEACHER" || role === "ADMIN";
}
