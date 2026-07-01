// "For You" ranking: a simple recency+engagement blend (a lightweight version
// of Reddit's "hot" formula) — comments count for more than likes since they
// take more effort, and everything decays with age so old posts fade out.
export function engagementScore(post, now) {
  const ageHours = Math.max(0, (now - new Date(post.createdAt).getTime()) / 3_600_000);
  const weight = (post._count?.likes || 0) * 1 + (post._count?.comments || 0) * 2;
  return weight / Math.pow(ageHours + 2, 1.5);
}

// Teacher/Admin posts and school-category posts are boosted to the top of
// every feed tab (Confirmed decision + spec: "Teacher/admin posts and
// announcements are pinned/boosted to the top across feeds").
export function isBoosted(post) {
  return post.author?.role === "TEACHER" || post.author?.role === "ADMIN" || (post.category && post.category !== "NONE");
}

// Stable partition: boosted posts move to the front, everything keeps its
// relative order within its own group (Array.sort is stable in Node/V8).
export function withBoostedFirst(posts) {
  return [...posts].sort((a, b) => (isBoosted(b) ? 1 : 0) - (isBoosted(a) ? 1 : 0));
}
