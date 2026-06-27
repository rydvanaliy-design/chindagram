import { prisma } from "@/lib/prisma";

// A post/comment is shown to a viewer when it isn't removed AND
// (it's approved/visible OR it's the viewer's own). Held (PENDING) content
// stays private to its author until a teacher/admin approves it.
export function visibleToViewer(me) {
  return { removed: false, OR: [{ status: "VISIBLE" }, { authorId: me }] };
}

export function postInclude(me) {
  return {
    author: { select: { id: true, name: true, image: true, role: true, gradeClass: true } },
    media: { orderBy: { order: "asc" } },
    _count: { select: { likes: true } },
    likes: { where: { userId: me }, select: { id: true } },
    saves: { where: { userId: me }, select: { id: true } },
    comments: {
      where: visibleToViewer(me),
      orderBy: { createdAt: "asc" },
      take: 50,
      include: { author: { select: { id: true, name: true, image: true, role: true, gradeClass: true } } },
    },
  };
}

export function toPostProps(p, me) {
  return {
    id: p.id,
    kind: p.kind,
    caption: p.caption,
    createdAt: p.createdAt.toISOString(),
    author: p.author,
    pending: p.status === "PENDING",
    media: p.media.map((m) => ({ url: m.url, type: m.type })),
    likeCount: p._count.likes,
    likedByMe: p.likes.length > 0,
    savedByMe: p.saves.length > 0,
    comments: p.comments.map((c) => ({
      id: c.id, body: c.body, createdAt: c.createdAt.toISOString(),
      author: c.author, mine: c.author.id === me, pending: c.status === "PENDING",
    })),
  };
}

export async function getPostList(where, me, take = 30) {
  const rows = await prisma.post.findMany({
    where: { ...visibleToViewer(me), ...where },
    orderBy: { createdAt: "desc" },
    take,
    include: postInclude(me),
  });
  return rows.map((p) => toPostProps(p, me));
}
