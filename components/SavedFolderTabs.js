import Link from "next/link";

export default function SavedFolderTabs({ collections, active, allCount, noneCount }) {
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
      <Link
        href="/saved"
        className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          active === "all" ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
        }`}
      >
        All Saved ({allCount})
      </Link>
      <Link
        href="/saved?collection=none"
        className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          active === "none" ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
        }`}
      >
        No folder ({noneCount})
      </Link>
      {collections.map((c) => (
        <Link
          key={c.id}
          href={`/saved?collection=${c.id}`}
          className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            active === c.id ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {c.name} ({c.count})
        </Link>
      ))}
    </nav>
  );
}
