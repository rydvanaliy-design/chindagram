# CLAUDE.md — Chindagram

Project brief for Claude Code. Read this first.

## What this is
Chindagram is a private, Instagram-style social platform for **Chindamanee School**. It is closed to the school and not public/indexable. **The platform has students (minors) on it, so safety and moderation matter** — keep that front of mind for any feature touching messaging, uploads, or visibility.

The owner is **non-technical**. Prefer clear explanations, small reversible changes, and running/verifying things yourself rather than handing over long command sequences. Keep the code simple and readable.

## Stack
- **Next.js 14 (App Router)**, plain **JavaScript** (no TypeScript — keep it that way).
- **Tailwind CSS v3** (brand colors in `tailwind.config.js`: `brand` #000080, `accent` #FFD700).
- **Prisma + SQLite** locally (`prisma/dev.db`); designed to swap to **Postgres** for production (change `datasource` provider + `DATABASE_URL`).
- **Auth.js (next-auth v5 beta)**, credentials provider, JWT sessions, no adapter.
- **bcryptjs** for password hashing.
- Node 22+ (works on 24).

## Run locally
```bash
npm install
npx prisma migrate dev --name init   # creates/updates dev.db; first time or after schema changes
npm run dev                           # http://localhost:3000
```
- `.env` holds `DATABASE_URL="file:./dev.db"` and `AUTH_SECRET`. Optionally add `ANTHROPIC_API_KEY` to turn on the AI helpers (caption suggestions, translation, writing assist) — without it, those buttons just stay hidden (`lib/ai.js`).
- **The first account created becomes ADMIN** (bootstrap in `app/api/register/route.js`).
- To reset all data: stop the app, `rm -f prisma/dev.db`, re-run `prisma migrate dev`.

## Project layout
```
app/                 pages + API routes (App Router)
  api/               register, posts, posts/[id] (+ like/comments/save), comments/[id],
                     users/[id]/follow, stories, messages (+ [id]), reports,
                     settings/profile, settings/password, admin/* 
  p/[id]             single post     u/[id] profile     messages, reels, explore,
  notifications, saved, settings, new, people, admin, login, register
components/          PostCard, PostMedia, Composer, StoriesBar, ReelsFeed, ChatThread,
                     FollowButton, BioEditor, SettingsForms, AdminActions, TopBar, BottomNav, Avatar, icons
lib/                 prisma.js, auth.js, guards.js, upload.js, notify.js, posts.js
prisma/schema.prisma data model
docs/                product spec, tech stack, design, hosting checklist
DEPLOY.md            how to put it online permanently
```

## Conventions that matter (don't break these)
- **Auth gating uses `getSessionUser()` from `lib/guards.js`**, which re-checks the database. It returns null for deleted/disabled users. Pages and login/register all use it. Do NOT gate with raw `auth()` alone — that caused a /login ↔ / redirect loop when a cookie outlived its DB row.
- **Post media** is a relation (`PostMedia`), ordered by `order`. Build post props with `postInclude(me)` + `toPostProps(row, me)` from `lib/posts.js` for consistency across feed/saved/explore/single-post.
- **Notifications** are created via `notify()` in `lib/notify.js` (no-op when actor === recipient).
- **Uploads** go through `lib/upload.js` (`saveMedia` for image/video, `saveImage` for avatars/stories). Local disk for now — see DEPLOY.md to swap to cloud before production (videos especially need a real host).
- **Admin/owner actions are authorized server-side** in the API routes, never trust the client.
- Soft-remove via a `removed` flag on Post/Comment/Message; owner-delete on posts/comments is a hard delete.

## Data model (prisma/schema.prisma)
User, Post (kind = PHOTO|REEL) + PostMedia, Story (24h `expiresAt`), Comment, Like, Save, Follow, Conversation + Message, Notification, Report (targets a post, comment, or message). Roles: USER | ADMIN.

## Status — what's built
Accounts; posts (single, multi-photo carousel, video reels); stories (24h); feed (followed + self); likes; comments; saved/bookmarks; follow/unfollow; profiles with avatar upload + editable name/bio; search & explore; notifications (like/comment/follow/message) with unread badge; direct messages (poll-based, ~4s) with message reporting + admin removal; admin queue (remove posts/comments/messages, disable accounts); settings (edit profile, change password). Responsive, mobile-first.

## Known limitations / sensible next steps
- **Registration is open — the owner's confirmed decision** (twice: v2 Phase 1 override, reaffirmed at launch). Do not add an email allowlist or approval gate unless the owner asks. Sign-up is rate-limited instead (`lib/ratelimit.js`, 5/hour/IP).
- **DMs are open with after-the-fact moderation** (owner's deliberate choice); delivery is realtime via self-hosted SSE (`lib/messageStream.js`) with a 10s polling fallback.
- **Rate limiting exists** (`lib/ratelimit.js`, in-memory, single-server by design) on register, login, posts, comments, messages, uploads, stories, reports, wall, AI. If the app ever scales past one server instance, move it (and messageStream) to Redis together.
- Media stays on local disk **by design** — the deployment target (DEPLOY.md) is a single persistent VM with nightly backups, not a serverless host. A video CDN only becomes worth it if usage outgrows the school.
- No automated tests yet; logic has been validated manually. Adding tests is worthwhile.

## v2 roadmap
The owner has defined a full next-version feature set in **`docs/FEATURES-SPEC.md`** — roles/QR onboarding, communities, events, richer messaging, moderation pipeline, bilingual UI, and more. Read it before planning v2 work, and follow its "Suggested build order". Note the "Decisions to confirm" at the top.

## When you make changes
- After schema edits: `npx prisma migrate dev --name <change>`.
- Verify with `npm run build` and the manual test flow in `README.md`.
- Explain changes plainly; the owner is learning.
