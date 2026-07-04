import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { canModerateContent } from "@/lib/roles";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import CreateClubForm from "@/components/CreateClubForm";

export default async function NewClubPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  if (!canModerateContent(viewer.role)) redirect("/clubs");
  const locale = await getLocale();
  const t = makeT(locale);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">{t("clubs.new.heading")}</h1>
        <CreateClubForm />
      </main>
      <BottomNav />
    </div>
  );
}
