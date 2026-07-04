import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { notify } from "@/lib/notify";

// School-wide announcement: a real, visible ANNOUNCEMENT-category post
// (discoverable in feeds/profile like any other announcement, boosted
// everywhere per the existing feed-boosting rule) PLUS a direct notification
// to every account, so nobody misses it just because they didn't scroll past it.
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { message } = await req.json().catch(() => ({}));
  const caption = String(message || "").trim().slice(0, 2000);
  if (!caption) return NextResponse.json({ error: "Write an announcement." }, { status: 400 });

  const post = await prisma.post.create({
    data: { authorId: admin.id, caption, kind: "TEXT", category: "ANNOUNCEMENT", status: "VISIBLE" },
    select: { id: true },
  });

  const users = await prisma.user.findMany({ where: { id: { not: admin.id }, disabled: false }, select: { id: true } });
  for (const u of users) {
    await notify({ recipientId: u.id, actorId: admin.id, type: "BROADCAST", postId: post.id });
  }

  return NextResponse.json({ ok: true, id: post.id });
}
