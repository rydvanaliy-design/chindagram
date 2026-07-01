import Link from "next/link";
import { ChevronLeft } from "@/components/icons";

// Slim drill-down header used by settings sub-pages: back arrow + centered
// title, no main nav chrome — keeps the focus on one task at a time.
export default function SettingsHeader({ title, back = "/settings" }) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center px-2">
        <Link href={back} aria-label="Back" className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
          <ChevronLeft />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold pr-8">{title}</h1>
      </div>
    </header>
  );
}
