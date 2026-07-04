"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";

// Renders a poll: tap an option to vote; shows result bars once you've voted.
export default function Poll({ postId, poll }) {
  const { t } = useT();
  const [options, setOptions] = useState(poll.options);
  const [myOptionId, setMyOptionId] = useState(poll.myOptionId);
  const [total, setTotal] = useState(poll.totalVotes);
  const [busy, setBusy] = useState(false);
  const voted = Boolean(myOptionId);

  async function vote(optionId) {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/posts/${postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      setOptions(d.options);
      setMyOptionId(d.myOptionId);
      setTotal(d.totalVotes);
    }
  }

  return (
    <div className="space-y-2 px-4 pb-1">
      {options.map((o) => {
        const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
        const mine = o.id === myOptionId;
        return (
          <button
            key={o.id}
            onClick={() => vote(o.id)}
            disabled={busy}
            className="relative w-full overflow-hidden rounded-lg border border-gray-200 px-3 py-2 text-left text-sm disabled:opacity-70"
          >
            {voted && (
              <span
                className={`absolute inset-y-0 left-0 ${mine ? "bg-brand/20" : "bg-gray-100"}`}
                style={{ width: `${pct}%` }}
              />
            )}
            <span className="relative flex items-center justify-between gap-2">
              <span className={mine ? "font-semibold text-brand" : ""}>{mine ? "✓ " : ""}{o.text}</span>
              {voted && <span className="text-xs text-gray-500">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-gray-400">
        {total === 1 ? t("posts.poll.vote") : t("posts.poll.votes", { count: total })}
        {voted ? "" : ` · ${t("posts.poll.tapToVote")}`}
      </p>
    </div>
  );
}
