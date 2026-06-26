import Link from "next/link";
import { auth } from "@/lib/auth";
import { Home, Reel, PlusSquare, Send, UserCircle } from "@/components/icons";

export default async function BottomNav() {
  const session = await auth();
  const user = session?.user;
  return (
    <nav className="sticky bottom-0 z-20 border-t border-gray-200 bg-white sm:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around px-5 py-3 text-gray-900">
        <Link href="/" aria-label="Home"><Home /></Link>
        <Link href="/reels" aria-label="Reels"><Reel /></Link>
        <Link href="/new" aria-label="New post"><PlusSquare /></Link>
        <Link href="/messages" aria-label="Messages"><Send /></Link>
        <Link href={user ? `/u/${user.id}` : "/login"} aria-label="Profile"><UserCircle /></Link>
      </div>
    </nav>
  );
}
