"use client";
import { useState } from "react";

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const res = await fetch("/api/settings/password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    setSaving(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setMsg("Password changed."); setCurrent(""); setNext(""); }
    else setMsg(d.error || "Could not change password.");
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-gray-200 bg-white p-5">
      <label className="mb-1 block text-xs font-medium text-gray-500">Current password</label>
      <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="ig-input mb-3" />
      <label className="mb-1 block text-xs font-medium text-gray-500">New password</label>
      <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min 8 characters" className="ig-input mb-3" />
      <div className="flex items-center gap-3">
        <button disabled={saving} className="ig-btn">{saving ? "Saving…" : "Update password"}</button>
        {msg && <span className="text-sm text-gray-500">{msg}</span>}
      </div>
    </form>
  );
}
