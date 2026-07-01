import Link from "next/link";

const TABS = [
  { key: "following", label: "Following" },
  { key: "foryou", label: "For You" },
  { key: "myclass", label: "My Class" },
  { key: "clubs", label: "Clubs" },
  { key: "announcements", label: "Announcements" },
];

export default function FeedTabs({ active }) {
  return (
    <nav className="no-scrollbar sticky top-14 z-10 flex gap-1 overflow-x-auto border-b border-gray-200 bg-white/95 px-2 backdrop-blur">
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.key === "following" ? "/" : `/?tab=${t.key}`}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ${
              isActive ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
