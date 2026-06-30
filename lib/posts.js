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
    pollOptions: {
      orderBy: { order: "asc" },
      include: { _count: { select: { votes: true } } },
    },
    pollVotes: { where: { userId: me }, select: { optionId: true } },
    collaborators: { include: { user: { select: { id: true, name: true } } } },
  };
}

export function toPostProps(p, me) {
  return {
    id: p.id,
    kind: p.kind,
    caption: p.caption,
    linkUrl: p.linkUrl,
    category: p.category,
    pinned: p.pinned,
    createdAt: p.createdAt.toISOString(),
    author: p.author,
    pending: p.status === "PENDING",
    media: p.media.map((m) => ({ url: m.url, type: m.type, name: m.name })),
    likeCount: p._count.likes,
    likedByMe: p.likes.length > 0,
    savedByMe: p.saves.length > 0,
    poll: p.kind === "POLL" ? {
      options: (p.pollOptions || []).map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
      myOptionId: p.pollVotes && p.pollVotes.length > 0 ? p.pollVotes[0].optionId : null,
      totalVotes: (p.pollOptions || []).reduce((s, o) => s + o._count.votes, 0),
    } : null,
    coAuthors: (p.collaborators || []).filter((c) => c.accepted).map((c) => ({ id: c.user.id, name: c.user.name })),
    myInvite: (() => {
      const mine = (p.collaborators || []).find((c) => c.userId === me);
      return mine && !mine.accepted ? { id: mine.id } : null;
    })(),
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
