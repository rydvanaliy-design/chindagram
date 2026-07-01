"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { THEMES, THEME_KEYS } from "@/lib/themes";

export default function EditProfileForm({ user }) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [pronouns, setPronouns] = useState(user.pronouns || "");
  const [interests, setInterests] = useState(user.interests || "");
  const [links, setLinks] = useState(user.links || "");
  const [theme, setTheme] = useState(user.theme || "default");
  const [avatarPreview, setAvatarPreview] = useState(user.image || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  function pickAvatar(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const form = new FormData();
    form.append("name", name);
    form.append("username", username);
    form.append("bio", bio);
    form.append("pronouns", pronouns);
    form.append("interests", interests);
    form.append("links", links);
    form.append("theme", theme);
    if (avatarFile) form.append("avatar", avatarFile);
    const res = await fetch("/api/settings/profile", { method: "POST", body: form });
    setSaving(false);
    if (res.ok) { setMsg("Saved."); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || "Could not save."); }
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-5 flex flex-col items-center">
        <Avatar name={name} image={avatarPreview} size={80} />
        <label className="mt-2 cursor-pointer text-sm font-semibold text-brand">
          Change profile photo
          <input type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
        </label>
      </div>
      <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="ig-input mb-3" />
      <label className="mb-1 block text-xs font-medium text-gray-500">Username</label>
      <div className="mb-3 flex items-center gap-1">
        <span className="text-gray-400">@</span>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="ig-input" />
      </div>
      <label className="mb-1 block text-xs font-medium text-gray-500">Pronouns</label>
      <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="she/her, he/him, they/them…" maxLength={40} className="ig-input mb-3" />
      <label className="mb-1 block text-xs font-medium text-gray-500">Bio</label>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} className="ig-input mb-3 resize-none" />
      <label className="mb-1 block text-xs font-medium text-gray-500">Interests <span className="text-gray-400">(comma-separated)</span></label>
      <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="art, football, coding" maxLength={200} className="ig-input mb-3" />
      <label className="mb-1 block text-xs font-medium text-gray-500">Links <span className="text-gray-400">(one per line)</span></label>
      <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2} placeholder="https://…" maxLength={500} className="ig-input mb-3 resize-none" />
      <label className="mb-1 block text-xs font-medium text-gray-500">Profile theme</label>
      <div className="mb-4 flex flex-wrap gap-2">
        {THEME_KEYS.map((k) => (
          <button type="button" key={k} onClick={() => setTheme(k)}
            title={THEMES[k].label}
            className={`h-8 w-8 rounded-full ${THEMES[k].chip} ${theme === k ? "ring-2 ring-offset-2 ring-gray-800" : ""}`} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button disabled={saving} className="ig-btn">{saving ? "Saving…" : "Save"}</button>
        {msg && <span className="text-sm text-gray-500">{msg}</span>}
      </div>
    </form>
  );
}
