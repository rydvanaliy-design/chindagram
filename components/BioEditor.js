"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BioEditor({ initialBio }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(initialBio || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        <p className="flex-1 whitespace-pre-wrap text-sm text-gray-700">
          {bio ? bio : <span className="text-gray-400">No bio yet.</span>}
        </p>
        <button onClick={() => setEditing(true)} className="text-xs font-semibold text-brand hover:underline">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        maxLength={300}
        placeholder="Write a short bio…"
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
        <button onClick={() => { setEditing(false); setBio(initialBio || ""); }} className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}
