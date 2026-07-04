import { prisma } from "@/lib/prisma";

const TAG_RE = /#([a-zA-Z0-9_]+)/g;

// Lightweight "hot hashtags" — count each tag once per post across a recent
// candidate pool. Good enough at the school's scale (80-200 users); no
// dedicated Hashtag model needed.
export async function trendingHashtags(where, limit = 8, take = 300) {
  const rows = await prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, take, select: { caption: true } });
  const counts = new Map();
  for (const r of rows) {
    if (!r.caption) continue;
    const seen = new Set();
    let m;
    TAG_RE.lastIndex = 0;
    while ((m = TAG_RE.exec(r.caption))) {
      const tag = m[1].toLowerCase();
      if (seen.has(tag)) continue; // count each tag once per post
      seen.add(tag);
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([tag, count]) => ({ tag, count }));
}
