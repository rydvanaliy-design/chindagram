# Chindagram

A private, Instagram-style platform for Chindamanee School.
Stack: Next.js (App Router) · Tailwind · Prisma + SQLite · Auth.js (credentials) · bcryptjs.

## First run / after a schema change (4 steps)
The database structure grew again (notifications, saved posts, message moderation), so rebuild it once:
```bash
cd chindagram
# 1. stop the app if it's running: press Control + C in its Terminal
# 2. delete the old database:
rm -f prisma/dev.db
# 3. rebuild it with the new structure:
npx prisma migrate dev --name social-extras
# 4. start the app:
npm run dev
```
Open **http://localhost:3000**. Day to day after this, you only need `npm run dev`.
The **first account you create is the admin.**

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
