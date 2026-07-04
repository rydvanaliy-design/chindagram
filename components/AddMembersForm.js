"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function AddMembersForm({ conversationId, users, spotsLeft }) {
  const { t } = useT();
  const router = useRouter();
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
      else if (next.size < spotsLeft) next.add(id);
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (picked.size === 0) { setError(t("messages.addMembersForm.pickAtLeastOne")); return; }
    setBusy(true);
    const res = await fetch(`/api/conversations/${conversationId}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberIds: [...picked] }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || t("messages.addMembersForm.addError")); return; }
    router.push(`/messages/${conversationId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input className="ig-input" placeholder={t("messages.addMembersForm.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="text-xs text-gray-500">{t("messages.addMembersForm.selectedCount", { count: picked.size, spots: spotsLeft })}</p>

      <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto rounded-2xl border border-gray-200 bg-white">
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-gray-400">{t("messages.addMembersForm.noneLeft")}</li>
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
      <button disabled={busy || spotsLeft === 0} className="ig-btn">{busy ? t("messages.addMembersForm.adding") : t("messages.addMembersForm.add")}</button>
    </form>
  );
}
