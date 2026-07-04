"use client";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

// "New folder" (always shown) plus "Rename" / "Delete" for the folder
// currently being viewed (only meaningful for a real collection, not the
// "All Saved" or "No folder" views).
export default function SavedFolderActions({ activeCollection }) {
  const { t } = useT();
  const router = useRouter();

  async function createFolder() {
    const name = window.prompt(t("saved.folder.createPrompt"));
    if (!name || !name.trim()) return;
    const res = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
    if (res.ok) router.refresh();
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("saved.folder.createError")); }
  }

  async function renameFolder() {
    const name = window.prompt(t("saved.folder.renamePrompt"), activeCollection.name);
    if (!name || !name.trim() || name.trim() === activeCollection.name) return;
    const res = await fetch(`/api/collections/${activeCollection.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) router.refresh();
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("saved.folder.renameError")); }
  }

  async function deleteFolder() {
    if (!window.confirm(t("saved.folder.deleteConfirm", { name: activeCollection.name }))) return;
    const res = await fetch(`/api/collections/${activeCollection.id}`, { method: "DELETE" });
    if (res.ok) router.push("/saved");
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("saved.folder.deleteError")); }
  }

  return (
    <div className="flex items-center gap-3 px-4 pb-2 text-xs">
      {activeCollection && (
        <>
          <button onClick={renameFolder} className="font-semibold text-gray-500 hover:text-brand">{t("saved.folder.rename")}</button>
          <button onClick={deleteFolder} className="font-semibold text-red-500 hover:underline">{t("saved.folder.delete")}</button>
        </>
      )}
      <button onClick={createFolder} className="ml-auto font-semibold text-brand">{t("saved.folder.new")}</button>
    </div>
  );
}
