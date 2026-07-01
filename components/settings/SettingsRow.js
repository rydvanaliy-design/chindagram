import Link from "next/link";
import { ChevronRight } from "@/components/icons";

// One tappable row in the settings list: icon + label (+ optional hint text) + chevron.
export function SettingsRow({ href, icon, label, hint, danger = false }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 ${danger ? "text-red-600" : "text-gray-900"}`}
    >
      <span className={danger ? "text-red-500" : "text-gray-500"}>{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {hint && <span className="text-sm text-gray-400">{hint}</span>}
      {!danger && <ChevronRight />}
    </Link>
  );
}

// A row that's a button instead of a link (e.g. Log out).
export function SettingsButtonRow({ onClick, icon, label, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 ${danger ? "text-red-600" : "text-gray-900"}`}
    >
      <span className={danger ? "text-red-500" : "text-gray-500"}>{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
    </button>
  );
}

// A bordered white rounded list container for grouping rows, with a small
// uppercase section label above it (matches the rest of the app's card style).
export function SettingsSection({ title, children }) {
  return (
    <section className="mb-6">
      {title && <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h2>}
      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">{children}</div>
    </section>
  );
}
