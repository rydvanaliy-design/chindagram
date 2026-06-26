import { prisma } from "@/lib/prisma";

export function postInclude(me) {
  return {
    author: { select: { id: true, name: true, image: true } },
    media: { orderBy: { order: "asc" } },
    _count: { select: { likes: true } },
    likes: { where: { userId: me }, select: { id: true } },
    saves: { where: { userId: me }, select: { id: true } },
    comments: {
      where: { removed: false },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: { author: { select: { id: true, name: true, image: true } } },
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
    media: p.media.map((m) => ({ url: m.url, type: m.type })),
    likeCount: p._count.likes,
    likedByMe: p.likes.length > 0,
    savedByMe: p.saves.length > 0,
    comments: p.comments.map((c) => ({
      id: c.id, body: c.body, createdAt: c.createdAt.toISOString(),
      author: c.author, mine: c.author.id === me,
    })),
  };
}

export async function getPostList(where, me, take = 30) {
  const rows = await prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, take, include: postInclude(me) });
  return rows.map((p) => toPostProps(p, me));
}
