"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowButton({ targetId, initialFollowing }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    setFollowing((v) => !v); // optimistic
    const res = await fetch(`/api/users/${targetId}/follow`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setFollowing(data.following);
      router.refresh(); // refresh follower counts + feed
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        following
          ? "rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          : "rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
