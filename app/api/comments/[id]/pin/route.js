import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { canModerateContent } from "@/lib/roles";

// Pin/unpin a comment to the top of its post — the post's author, or a
// teacher/admin, can do this. Reply comments can't be pinned (matches how
// the thread renders: pinned items sit among the top-level comments).
export async function POST(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const comment = await prisma.comment.findUnique({
    where: { id: params.id },
    select: { id: true, pinned: true, parentId: true, post: { select: { authorId: true } } },
  });
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  if (comment.parentId) return NextResponse.json({ error: "Replies can't be pinned." }, { status: 400 });

  const allowed = comment.post.authorId === me.id || canModerateContent(me.role);
  if (!allowed) return NextResponse.json({ error: "Only the post's author can pin comments." }, { status: 403 });

  const pinned = !comment.pinned;
  await prisma.comment.update({ where: { id: comment.id }, data: { pinned } });
  return NextResponse.json({ ok: true, pinned });
}
