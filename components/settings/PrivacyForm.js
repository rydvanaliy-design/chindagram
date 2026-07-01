"use client";
import { useState } from "react";

// Account privacy toggle (Confirmed decision #1). Teacher/Admin accounts are
// always public and don't get a toggle at all.
export default function PrivacyForm({ initialPrivate, isStaff }) {
  const [isPrivate, setIsPrivate] = useState(initialPrivate);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function toggle() {
    setBusy(true); setMsg("");
    const next = !isPrivate;
    const res = await fetch("/api/settings/privacy", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ private: next }),
    });
    setBusy(false);
    if (res.ok) setIsPrivate(next);
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || "Could not save."); }
  }

  if (isStaff) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-gray-900">Public account</p>
        <p className="mt-1 text-sm text-gray-500">
          Teacher and Admin accounts are always public, so everyone in the school can see announcements and posts.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Private account</p>
          <p className="mt-1 text-sm text-gray-500">
            When your account is private, only people you approve can see your posts.
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          aria-pressed={isPrivate}
          aria-label="Toggle private account"
          className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${isPrivate ? "bg-brand" : "bg-gray-300"}`}
        >
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${isPrivate ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
    </div>
  );
}
