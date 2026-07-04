import Link from "next/link";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

const TAB_KEYS = ["following", "foryou", "myclass", "clubs", "announcements"];

export default async function FeedTabs({ active }) {
  const locale = await getLocale();
  const t = makeT(locale);

  return (
    <nav className="no-scrollbar sticky top-14 z-10 flex gap-1 overflow-x-auto border-b border-gray-200 bg-white/95 px-2 backdrop-blur">
      {TAB_KEYS.map((key) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={key === "following" ? "/" : `/?tab=${key}`}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ${
              isActive ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t(`posts.feed.tabs.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
