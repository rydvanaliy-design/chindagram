"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { Repost } from "@/components/icons";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function RepostMenu({ postId }) {
  const router = useRouter();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState(null);
  const [pickingContact, setPickingContact] = useState(false);

  function closeAll() { setOpen(false); setPickingContact(false); }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) { if (e.key === "Escape") closeAll(); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function shareToFeed() {
    const caption = window.prompt(t("posts.repost.commentPrompt")) ?? "";
    setBusy(true);
    const form = new FormData();
    form.append("kind", "REPOST");
    form.append("originalPostId", postId);
    if (caption.trim()) form.append("caption", caption.trim());
    const res = await fetch("/api/posts", { method: "POST", body: form });
    setBusy(false);
    closeAll();
    if (res.ok) { window.alert(t("posts.repost.repostedToFeed")); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("posts.repost.repostError")); }
  }

  async function addToStory() {
    setBusy(true);
    const res = await fetch("/api/stories", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repostOfId: postId }),
    });
    setBusy(false);
    closeAll();
    if (res.ok) { window.alert(t("posts.repost.addedToStory")); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("posts.repost.addToStoryError")); }
  }

  async function openContactPicker() {
    setPickingContact(true);
    if (!contacts) {
      const res = await fetch("/api/conversations");
      setContacts(res.ok ? (await res.json()).conversations : []);
    }
  }

  async function sendTo(conversationId) {
    setBusy(true);
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharedPostId: postId }),
    });
    setBusy(false);
    closeAll();
    if (res.ok) window.alert(t("posts.repost.sent"));
    else { const d = await res.json().catch(() => ({})); window.alert(d.error || t("posts.repost.sendError")); }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label={t("posts.repost.repost")} className="pt-0.5 text-gray-700 transition active:scale-90 hover:text-brand">
        <Repost />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={closeAll} />
          <div className="absolute bottom-full left-0 z-20 mb-2 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {!pickingContact ? (
              <>
                <button disabled={busy} onClick={shareToFeed} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50">{t("posts.repost.shareToFeed")}</button>
                <button disabled={busy} onClick={addToStory} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50">{t("posts.repost.addToStory")}</button>
                <button disabled={busy} onClick={openContactPicker} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50">{t("posts.repost.sendInMessage")}</button>
              </>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {contacts === null ? (
                  <p className="px-4 py-2 text-xs text-gray-400">{t("posts.repost.loadingContacts")}</p>
                ) : contacts.length === 0 ? (
                  <p className="px-4 py-2 text-xs text-gray-400">{t("posts.repost.noConversations")}</p>
                ) : contacts.map((c) => (
                  <button key={c.id} disabled={busy} onClick={() => sendTo(c.id)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50">
                    <Avatar name={c.name} image={c.image} size={24} />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
