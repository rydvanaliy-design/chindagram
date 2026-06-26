"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { X } from "@/components/icons";

export default function StoriesBar({ groups, me }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState(null); // { groupIndex, storyIndex }

  async function addStory(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch("/api/stories", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) router.refresh();
    else window.alert("Could not add story.");
  }

  function openGroup(gi) { setViewer({ gi, si: 0 }); }
  function next() {
    if (!viewer) return;
    const group = groups[viewer.gi];
    if (viewer.si + 1 < group.stories.length) setViewer({ ...viewer, si: viewer.si + 1 });
    else if (viewer.gi + 1 < groups.length) setViewer({ gi: viewer.gi + 1, si: 0 });
    else setViewer(null);
  }

  const active = viewer ? groups[viewer.gi].stories[viewer.si] : null;
  const activeAuthor = viewer ? groups[viewer.gi].author : null;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="no-scrollbar mx-auto flex max-w-xl gap-4 overflow-x-auto px-4 py-3">
        {/* Your story / add */}
        <button onClick={() => fileRef.current?.click()} className="flex w-16 shrink-0 flex-col items-center gap-1">
          <span className="relative">
            <Avatar name={me.name} image={me.image} size={56} />
            <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-brand text-xs font-bold text-white">+</span>
          </span>
          <span className="w-16 truncate text-center text-xs text-gray-600">{uploading ? "…" : "Your story"}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={addStory} className="hidden" />

        {groups.map((g, gi) => (
          <button key={g.author.id} onClick={() => openGroup(gi)} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <Avatar name={g.author.name} image={g.author.image} size={56} ring />
            <span className="w-16 truncate text-center text-xs text-gray-700">{g.author.name}</span>
          </button>
        ))}
      </div>

      {/* Full-screen viewer */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={next}>
          <div className="absolute left-0 right-0 top-0 flex items-center gap-3 p-4 text-white">
            <Avatar name={activeAuthor.name} image={activeAuthor.image} size={32} />
            <span className="text-sm font-semibold">{activeAuthor.name}</span>
            <button onClick={(e) => { e.stopPropagation(); setViewer(null); }} className="ml-auto" aria-label="Close"><X /></button>
          </div>
          <img src={active.imageUrl} alt="" className="max-h-[85vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
