import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { canModerateContent } from "@/lib/roles";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import CreateEventForm from "@/components/CreateEventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  if (!canModerateContent(viewer.role)) redirect("/events");

  const clubs = await prisma.club.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">New event</h1>
        <CreateEventForm clubs={clubs} />
      </main>
      <BottomNav />
    </div>
  );
}
