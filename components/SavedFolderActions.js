"use client";
import { useRouter } from "next/navigation";

// "New folder" (always shown) plus "Rename" / "Delete" for the folder
// currently being viewed (only meaningful for a real collection, not the
// "All Saved" or "No folder" views).
export default function SavedFolderActions({ activeCollection }) {
  const router = useRouter();

  async function createFolder() {
    const name = window.prompt("Name this folder:");
    if (!name || !name.trim()) return;
    const res = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
    if (res.ok) router.refresh();
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || "Could not create folder."); }
  }

  async function renameFolder() {
    const name = window.prompt("Rename this folder:", activeCollection.name);
    if (!name || !name.trim() || name.trim() === activeCollection.name) return;
    const res = await fetch(`/api/collections/${activeCollection.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) router.refresh();
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || "Could not rename folder."); }
  }

  async function deleteFolder() {
    if (!window.confirm(`Delete "${activeCollection.name}"? Saved posts stay saved, just un-filed.`)) return;
    const res = await fetch(`/api/collections/${activeCollection.id}`, { method: "DELETE" });
    if (res.ok) router.push("/saved");
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || "Could not delete folder."); }
  }

  return (
    <div className="flex items-center gap-3 px-4 pb-2 text-xs">
      {activeCollection && (
        <>
          <button onClick={renameFolder} className="font-semibold text-gray-500 hover:text-brand">Rename folder</button>
          <button onClick={deleteFolder} className="font-semibold text-red-500 hover:underline">Delete folder</button>
        </>
      )}
      <button onClick={createFolder} className="ml-auto font-semibold text-brand">+ New folder</button>
    </div>
  );
}
