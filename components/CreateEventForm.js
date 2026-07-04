"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function CreateEventForm({ clubs }) {
  const router = useRouter();
  const { t } = useT();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [tieTo, setTieTo] = useState("none"); // none | club | class
  const [clubId, setClubId] = useState(clubs[0]?.id || "");
  const [gradeClass, setGradeClass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    const res = await fetch("/api/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, location, startAt, endAt: endAt || null,
        clubId: tieTo === "club" ? clubId : null,
        gradeClass: tieTo === "class" ? gradeClass : null,
      }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || t("events.new.createError")); return; }
    const d = await res.json();
    router.push(`/events/${d.id}`);
    router.refresh();
  }

  const tieOptions = [
    { key: "none", label: t("events.new.tiedToSchoolWide") },
    { key: "club", label: t("events.new.tiedToClub") },
    { key: "class", label: t("events.new.tiedToClass") },
  ];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input className="ig-input" placeholder={t("events.new.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
      <textarea className="ig-input resize-none" placeholder={t("events.new.descriptionPlaceholder")} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
      <input className="ig-input" placeholder={t("events.new.locationPlaceholder")} value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} />

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-gray-500">
          {t("events.new.startsLabel")}
          <input type="datetime-local" className="ig-input mt-1" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
        </label>
        <label className="text-xs text-gray-500">
          {t("events.new.endsLabel")} <span className="text-gray-400">{t("events.new.endsOptional")}</span>
          <input type="datetime-local" className="ig-input mt-1" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </label>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-gray-500">{t("events.new.tiedToLabel")}</p>
        <div className="flex flex-wrap gap-2">
          {tieOptions.map((o) => (
            <button type="button" key={o.key} onClick={() => setTieTo(o.key)}
              className={tieTo === o.key ? "rounded-full bg-brand px-3 py-1 text-sm font-semibold text-white" : "rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600"}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {tieTo === "club" && (
        clubs.length === 0 ? (
          <p className="text-xs text-gray-400">{t("events.new.noClubsExist")}</p>
        ) : (
          <select className="ig-input" value={clubId} onChange={(e) => setClubId(e.target.value)}>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )
      )}
      {tieTo === "class" && (
        <input className="ig-input" placeholder={t("events.new.classPlaceholder")} value={gradeClass} onChange={(e) => setGradeClass(e.target.value)} maxLength={40} />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="ig-btn">{busy ? t("events.new.creating") : t("events.new.create")}</button>
    </form>
  );
}
