import { NextResponse } from "next/server";
import { rateLimit, tooManyResponse } from "@/lib/ratelimit";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";
import { decideTextStatus } from "@/lib/moderation";

export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const posted = rateLimit(`comment:${userId}`, 30, 10 * 60 * 1000);
  if (!posted.ok) return tooManyResponse(posted.retryAfterSec);

  const { body, parentId, mediaUrl, mediaType } = await req.json();
  const text = String(body || "").trim();
  if (!text && !mediaUrl) return NextResponse.json({ error: "Comment is empty." }, { status: 400 });
  if (text.length > 1000) return NextResponse.json({ error: "Comment is too long." }, { status: 400 });

  const targetPost = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (!targetPost) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (targetPost.authorId !== userId) {
    const blocked = await prisma.block.findFirst({
      where: { OR: [{ blockerId: userId, blockedId: targetPost.authorId }, { blockerId: targetPost.authorId, blockedId: userId }] },
    });
    if (blocked) return NextResponse.json({ error: "You can't comment on this post." }, { status: 403 });
  }

  // One level of threading only — a reply to a reply attaches to that
  // reply's own top-level parent instead, matching how the thread renders.
  let replyToId = null;
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, postId: true, parentId: true, authorId: true } });
    if (parent && parent.postId === params.id) {
      replyToId = parent.parentId || parent.id;
    }
  }

  // Run the comment through the automated filter; held comments wait for review.
  const { status, flagReason } = await decideTextStatus(text);

  const comment = await prisma.comment.create({
    data: {
      body: text, postId: params.id, authorId: userId, status, flagReason, parentId: replyToId,
      mediaUrl: mediaUrl || null, mediaType: mediaUrl ? (mediaType === "GIF" ? "GIF" : "IMAGE") : null,
    },
    include: { author: { select: { id: true, name: true, image: true, role: true, gradeClass: true } } },
  });

  // Only notify once the comment is actually public. Replies notify whoever
  // they're replying to; top-level comments notify the post author.
  if (status === "VISIBLE") {
    if (replyToId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: replyToId }, select: { authorId: true } });
      if (parentComment) await notify({ recipientId: parentComment.authorId, actorId: userId, type: "COMMENT_REPLY", postId: params.id });
    } else {
      await notify({ recipientId: targetPost.authorId, actorId: userId, type: "COMMENT", postId: params.id });
    }
  }

  return NextResponse.json({
    comment: {
      id: comment.id, body: comment.body, mediaUrl: comment.mediaUrl, mediaType: comment.mediaType,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author, mine: true, status: comment.status,
      pinned: false, likeCount: 0, likedByMe: false, replies: [],
      parentId: replyToId,
    },
  }, { status: 201 });
}
