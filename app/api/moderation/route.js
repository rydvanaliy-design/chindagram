import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireContentModerator } from "@/lib/guards";
import { notify } from "@/lib/notify";

// Teacher/admin review actions on a post or comment:
//   action "approve" -> make it public (status VISIBLE), resolve its reports
//   action "remove"  -> take it down (removed: true), resolve its reports
export async function POST(req) {
  const mod = await requireContentModerator();
  if (!mod) return NextResponse.json({ error: "Teachers or admins only." }, { status: 403 });

  const { type, id, action } = await req.json().catch(() => ({}));
  if (!["post", "comment", "wallpost"].includes(type) || !id || !["approve", "remove"].includes(action)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (type === "wallpost") {
    const wp = await prisma.wallPost.findUnique({ where: { id }, select: { id: true } });
    if (!wp) return NextResponse.json({ error: "Wall post not found." }, { status: 404 });
    if (action === "approve") {
      await prisma.wallPost.update({ where: { id }, data: { status: "VISIBLE", flagReason: null } });
    } else {
      await prisma.wallPost.update({ where: { id }, data: { removed: true } });
    }
    await prisma.report.updateMany({ where: { wallPostId: id, status: "OPEN" }, data: { status: "RESOLVED" } });
    return NextResponse.json({ ok: true });
  }

  if (type === "post") {
    const post = await prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } });
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    if (action === "approve") {
      await prisma.post.update({ where: { id }, data: { status: "VISIBLE", flagReason: null } });
    } else {
      await prisma.post.update({ where: { id }, data: { removed: true } });
    }
    await prisma.report.updateMany({ where: { postId: id, status: "OPEN" }, data: { status: "RESOLVED" } });
    return NextResponse.json({ ok: true });
  }

  // type === "comment"
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, authorId: true, postId: true, status: true },
  });
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  if (action === "approve") {
    await prisma.comment.update({ where: { id }, data: { status: "VISIBLE", flagReason: null } });
    // Now that it's public, notify the post author (skipped at creation time).
    if (comment.status === "PENDING") {
      const post = await prisma.post.findUnique({ where: { id: comment.postId }, select: { authorId: true } });
      if (post) await notify({ recipientId: post.authorId, actorId: comment.authorId, type: "COMMENT", postId: comment.postId });
    }
  } else {
    await prisma.comment.update({ where: { id }, data: { removed: true } });
  }
  await prisma.report.updateMany({ where: { commentId: id, status: "OPEN" }, data: { status: "RESOLVED" } });
  return NextResponse.json({ ok: true });
}
