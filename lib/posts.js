import { prisma } from "@/lib/prisma";
import { postVisibleToViewer } from "@/lib/privacy";

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
    // Every reaction row (not just mine) — small school scale, cheap to
    // aggregate the type breakdown in JS rather than a per-post groupBy query.
    likes: { select: { type: true, userId: true } },
    saves: { where: { userId: me }, select: { id: true, collectionId: true } },
    // Top-level comments only — replies are nested one level inside. Pinned
    // comments surface first, then newest-first within each group.
    comments: {
      where: { ...visibleToViewer(me), parentId: null },
      orderBy: [{ pinned: "desc" }, { createdAt: "asc" }],
      take: 50,
      include: {
        author: { select: { id: true, name: true, image: true, role: true, gradeClass: true } },
        likes: { where: { userId: me }, select: { id: true } },
        _count: { select: { likes: true } },
        replies: {
          where: visibleToViewer(me),
          orderBy: { createdAt: "asc" },
          take: 50,
          include: {
            author: { select: { id: true, name: true, image: true, role: true, gradeClass: true } },
            likes: { where: { userId: me }, select: { id: true } },
            _count: { select: { likes: true } },
          },
        },
      },
    },
    pollOptions: {
      orderBy: { order: "asc" },
      include: { _count: { select: { votes: true } } },
    },
    pollVotes: { where: { userId: me }, select: { optionId: true } },
    collaborators: { include: { user: { select: { id: true, name: true } } } },
    // Reposts point at the true original (never another repost — see the
    // flattening in app/api/posts/route.js), so one level of include is enough.
    repostOf: {
      select: {
        id: true, kind: true, caption: true, linkUrl: true, createdAt: true,
        removed: true, status: true,
        author: { select: { id: true, name: true, image: true, role: true, gradeClass: true } },
        media: { orderBy: { order: "asc" } },
      },
    },
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
    totalReactions: p.likes.length,
    myReaction: p.likes.find((l) => l.userId === me)?.type || null,
    reactionBreakdown: p.likes.reduce((acc, l) => { acc[l.type] = (acc[l.type] || 0) + 1; return acc; }, {}),
    savedByMe: p.saves.length > 0,
    savedCollectionId: p.saves[0]?.collectionId || null,
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
    comments: p.comments.map((c) => toCommentProps(c, me)),
    repostOf: p.repostOf ? {
      id: p.repostOf.id,
      kind: p.repostOf.kind,
      caption: p.repostOf.caption,
      linkUrl: p.repostOf.linkUrl,
      createdAt: p.repostOf.createdAt.toISOString(),
      author: p.repostOf.author,
      media: p.repostOf.media.map((m) => ({ url: m.url, type: m.type, name: m.name })),
      unavailable: p.repostOf.removed || (p.repostOf.status !== "VISIBLE" && p.repostOf.author.id !== me),
    } : (p.kind === "REPOST" ? { unavailable: true } : null),
  };
}

function toCommentProps(c, me) {
  return {
    id: c.id, body: c.body, mediaUrl: c.mediaUrl, mediaType: c.mediaType,
    createdAt: c.createdAt.toISOString(),
    author: c.author, mine: c.author.id === me, pending: c.status === "PENDING",
    pinned: c.pinned,
    likeCount: c._count.likes, likedByMe: c.likes.length > 0,
    replies: (c.replies || []).map((r) => toCommentProps(r, me)),
  };
}

export async function getPostList(where, me, take = 30) {
  // Combine moderation visibility, account-privacy visibility, and the
  // caller's own filter via AND — each has its own OR internally, and
  // spreading them together would silently clobber one another's `OR` key.
  const rows = await prisma.post.findMany({
    where: { AND: [visibleToViewer(me), postVisibleToViewer(me), where] },
    orderBy: { createdAt: "desc" },
    take,
    include: postInclude(me),
  });
  return rows.map((p) => toPostProps(p, me));
}
