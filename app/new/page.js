import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Composer from "@/components/Composer";

export default async function NewPostPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">New post</h1>
        <Composer />
      </main>
      <BottomNav />
    </div>
  );
}
