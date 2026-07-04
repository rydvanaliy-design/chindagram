"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function CreateClubForm() {
  const router = useRouter();
  const { t } = useT();
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
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || t("clubs.new.createError")); return; }
    const d = await res.json();
    router.push(`/clubs/${d.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input className="ig-input" placeholder={t("clubs.new.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      <textarea className="ig-input resize-none" placeholder={t("clubs.new.descriptionPlaceholder")} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="ig-btn">{busy ? t("clubs.new.creating") : t("clubs.new.create")}</button>
    </form>
  );
}
