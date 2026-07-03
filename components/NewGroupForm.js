"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

export default function NewGroupForm({ users }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(new Set());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () => users.filter((u) => u.name.toLowerCase().includes(q.trim().toLowerCase())),
    [users, q]
  );

  function toggle(id) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 29) next.add(id);
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (picked.size === 0) { setError("Pick at least one other person."); return; }
    setBusy(true);
    const res = await fetch("/api/conversations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberIds: [...picked], name }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Could not create group."); return; }
    const d = await res.json();
    router.push(`/messages/${d.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input className="ig-input" placeholder="Group name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <input className="ig-input" placeholder="Search people…" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="text-xs text-gray-500">{picked.size} selected (up to 29, plus you)</p>

      <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto rounded-2xl border border-gray-200 bg-white">
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-gray-400">No one found.</li>
        ) : filtered.map((u) => (
          <li key={u.id}>
            <button type="button" onClick={() => toggle(u.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
              <Avatar name={u.name} image={u.image} size={40} />
              <span className="flex-1 truncate text-sm font-medium">{u.name}</span>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${picked.has(u.id) ? "border-brand bg-brand text-white" : "border-gray-300"}`}>
                {picked.has(u.id) && "✓"}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="ig-btn">{busy ? "Creating…" : "Create group"}</button>
    </form>
  );
}
