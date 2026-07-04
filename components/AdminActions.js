"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

function useAction(errorMessage) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run(url, body) {
    setBusy(true);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else window.alert(errorMessage);
  }
  return { busy, run };
}

export function RemovePostBtn({ postId }) {
  const { t } = useT();
  const { busy, run } = useAction(t("admin.actions.actionFailed"));
  return (
    <button onClick={() => run("/api/admin/remove-post", { postId })} disabled={busy}
      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
      {t("admin.actions.removePost")}
    </button>
  );
}

export function RemoveCommentBtn({ commentId }) {
  const { t } = useT();
  const { busy, run } = useAction(t("admin.actions.actionFailed"));
  return (
    <button onClick={() => run("/api/admin/remove-comment", { commentId })} disabled={busy}
      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
      {t("admin.actions.removeComment")}
    </button>
  );
}

export function DisableUserBtn({ userId, disabled }) {
  const { t } = useT();
  const { busy, run } = useAction(t("admin.actions.actionFailed"));
  return (
    <button onClick={() => run("/api/admin/disable-user", { userId, disabled: !disabled })} disabled={busy}
      className={
        disabled
          ? "rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-60"
          : "rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
      }>
      {disabled ? t("admin.accounts.enable") : t("admin.accounts.disable")}
    </button>
  );
}

export function RemoveMessageBtn({ messageId }) {
  const { t } = useT();
  const { busy, run } = useAction(t("admin.actions.actionFailed"));
  return (
    <button onClick={() => run("/api/admin/remove-message", { messageId })} disabled={busy}
      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
      {t("admin.actions.removeMessage")}
    </button>
  );
}
