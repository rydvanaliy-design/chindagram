import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Search, Bell, Send, Shield } from "@/components/icons";

export default async function TopBar() {
  const session = await auth();
  const user = session?.user;
  let unread = 0;
  if (user?.id) {
    try { unread = await prisma.notification.count({ where: { recipientId: user.id, read: false } }); } catch {}
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Chindagram" className="h-7 w-7 rounded-md" />
          <span className="text-xl font-bold tracking-tight text-brand">Chindagram</span>
        </Link>
        <nav className="flex items-center gap-4 text-gray-800">
          {user?.role === "ADMIN" && <Link href="/admin" title="Admin" className="hover:text-brand"><Shield /></Link>}
          <Link href="/explore" title="Search" className="hover:text-brand"><Search /></Link>
          <Link href="/notifications" title="Notifications" className="relative hover:text-brand">
            <Bell />
            {unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          <Link href="/messages" title="Messages" className="hover:text-brand"><Send /></Link>
        </nav>
      </div>
    </header>
  );
}
