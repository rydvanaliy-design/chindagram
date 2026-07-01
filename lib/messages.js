// Shape a shared-post relation (Message.sharedPost) into the compact props
// PostEmbed expects — mirrors the repostOf shaping in lib/posts.js.
export function toSharedPostProps(sp, me) {
  if (!sp) return null;
  return {
    id: sp.id, kind: sp.kind, caption: sp.caption, linkUrl: sp.linkUrl, createdAt: sp.createdAt.toISOString(),
    author: sp.author, media: sp.media.map((m) => ({ url: m.url, type: m.type, name: m.name })),
    unavailable: sp.removed || (sp.status !== "VISIBLE" && sp.author.id !== me),
  };
}

export const sharedPostInclude = {
  select: {
    id: true, kind: true, caption: true, linkUrl: true, createdAt: true, removed: true, status: true,
    author: { select: { id: true, name: true, image: true } },
    media: { orderBy: { order: "asc" } },
  },
};
