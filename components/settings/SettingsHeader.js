import Link from "next/link";
import { ChevronLeft } from "@/components/icons";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

// Slim drill-down header used by settings sub-pages: back arrow + centered
// title, no main nav chrome — keeps the focus on one task at a time.
export default async function SettingsHeader({ title, back = "/settings" }) {
  const locale = await getLocale();
  const t = makeT(locale);
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center px-2">
        <Link href={back} aria-label={t("settings.back")} className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
          <ChevronLeft />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold pr-8">{title}</h1>
      </div>
    </header>
  );
}
