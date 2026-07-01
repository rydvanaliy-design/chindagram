"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateClubForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    const res = await fetch("/api/clubs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Could not create club."); return; }
    const d = await res.json();
    router.push(`/clubs/${d.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input className="ig-input" placeholder="Club name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      <textarea className="ig-input resize-none" placeholder="What's it about? (optional)" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="ig-btn">{busy ? "Creating…" : "Create club"}</button>
    </form>
  );
}
