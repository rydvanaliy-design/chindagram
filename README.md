# Chindagram

A private, Instagram-style platform for Chindamanee School.

**Stack:** Next.js (App Router) · Tailwind · Prisma + Postgres · Auth.js (credentials) · bcryptjs
**Hosting:** Vercel (Singapore) + Supabase for the database, file storage and realtime chat

## Running it

You need a Supabase project first — the app keeps its database and uploaded
photos there. Full walkthrough in [DEPLOY.md](DEPLOY.md).

```bash
npm install
cp .env.example .env
bash scripts/setup-env.sh        # fills in the keys; input is hidden
npx prisma migrate deploy        # creates the tables
node scripts/verify-supabase.mjs # checks it all works
npm run dev
```

Open **http://localhost:3000**. The **first account you create is the admin.**

## How the hosting works

Uploaded photos are **compressed in the browser before upload** — resized to
1600px and re-encoded as WebP, taking a 2.4 MB phone photo down to about
220 KB. That is what keeps the app inside Supabase's free 1 GB of storage
(roughly 4,500 photos instead of ~300), and what stops the feed buffering on a
school mobile connection. Videos are capped at 15 MB rather than re-encoded,
because doing that in a browser is unreliable on iPhones.

Files never pass through the app server: the browser gets a signed URL and
uploads straight to Supabase. Live chat runs over Supabase Realtime on channels
named with an HMAC, so only members of a conversation can subscribe to it.

The admin page shows how full storage is, and warns at 70%.

## Everything it does now
- **Accounts** — email + password; logged-out visitors see only login; disabled accounts are locked out.
- **Posts** — single photo, **multi-photo carousels** (up to 10), or a **video Reel**. Delete your own anytime.
- **Feed** — people you follow + your own, newest first, with a **Stories** row on top.
- **Stories (24h)**, **Reels** (vertical video feed), **Likes**, **Comments** (delete your own).
- **Saved posts** — bookmark any post, find them on the Saved page.
- **Follow / unfollow**, **Profiles** with avatar upload, editable name + bio, follower/following/post counts and a photo+reel grid.
- **Search & Explore** — find people by name, browse a grid of recent posts (tap any to open it).
- **Notifications** — likes, comments, follows, and messages, with an unread badge on the bell.
- **Direct messages** — start from a profile's Message button; new messages arrive within a few seconds.
- **Settings** — edit profile, upload a profile photo, change your password.
- **Admin & safety** — Report on posts, comments, **and messages**; an `/admin` queue to remove any of them and disable accounts. Admins only, checked on the server.

## Safe & fast
Passwords hashed; disabled accounts blocked on every action; admin tools server-checked; messages reportable and removable; search engines blocked; security headers; uploads capped (images 8 MB, video 60 MB); database indexed; feeds limited to recent items.

## Putting it online permanently
See **DEPLOY.md**: SQLite → **Postgres** (Neon), local uploads → **Cloudinary** (photos) and a video host for reels, deploy on **Vercel**. Lock sign-up to approved school emails before real students join.

## Deliberately not built yet
Live realtime chat (messages currently refresh every few seconds, not instant), group DMs, and automatic video processing/compression. These need extra infrastructure and are best done as their own step.
