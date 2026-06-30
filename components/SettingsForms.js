"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { THEMES, THEME_KEYS } from "@/lib/themes";

export default function SettingsForms({ user }) {
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
  const [pMsg, setPMsg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  function pickAvatar(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true); setPMsg("");
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
    setSavingProfile(false);
    if (res.ok) { setPMsg("Saved."); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setPMsg(d.error || "Could not save."); }
  }

  async function savePassword(e) {
    e.preventDefault();
    setSavingPw(true); setPwMsg("");
    const res = await fetch("/api/settings/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current, next }) });
    setSavingPw(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setPwMsg("Password changed."); setCurrent(""); setNext(""); }
    else setPwMsg(d.error || "Could not change password.");
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveProfile} className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Edit profile</h2>
        <div className="mb-4 flex items-center gap-4">
          <Avatar name={name} image={avatarPreview} size={64} />
          <label className="ig-btn-soft cursor-pointer">
            Change photo
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
          <button disabled={savingProfile} className="ig-btn">{savingProfile ? "Saving…" : "Save profile"}</button>
          {pMsg && <span className="text-sm text-gray-500">{pMsg}</span>}
        </div>
      </form>

      <form onSubmit={savePassword} className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Change password</h2>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" className="ig-input mb-3" />
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (min 8)" className="ig-input mb-3" />
        <div className="flex items-center gap-3">
          <button disabled={savingPw} className="ig-btn">{savingPw ? "Saving…" : "Update password"}</button>
          {pwMsg && <span className="text-sm text-gray-500">{pwMsg}</span>}
        </div>
      </form>
    </div>
  );
}
