import Link from "next/link";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export default async function SavedFolderTabs({ collections, active, allCount, noneCount }) {
  const locale = await getLocale();
  const t = makeT(locale);
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
      <Link
        href="/saved"
        className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          active === "all" ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
        }`}
      >
        {t("saved.tabs.all", { count: allCount })}
      </Link>
      <Link
        href="/saved?collection=none"
        className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          active === "none" ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
        }`}
      >
        {t("saved.tabs.noFolder", { count: noneCount })}
      </Link>
      {collections.map((c) => (
        <Link
          key={c.id}
          href={`/saved?collection=${c.id}`}
          className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            active === c.id ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {t("saved.tabs.folder", { name: c.name, count: c.count })}
        </Link>
      ))}
    </nav>
  );
}
