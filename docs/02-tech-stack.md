# Tech Stack: Chindamanee Social

Chosen for: you already know JavaScript and Node, it runs on your machine with almost no setup, and it has a clean path to going live later without a rewrite.

## The stack
- **Next.js (App Router)** — frontend and backend in one framework. Pages for the UI, built-in API routes for the server. One thing to learn, one thing to run, one thing to deploy.
- **Tailwind CSS** — styling. Fast to build an Instagram-like look, and Claude handles it well.
- **Prisma + Postgres (Supabase)** — the database. Prisma is the layer your code uses to read and write it; Supabase hosts the Postgres, in Singapore, on its free plan.
- **Auth.js (NextAuth), credentials provider** — email + password login. Use the library, do not hand-roll password security. This matters more here because real students' accounts are involved.
- **Image uploads: Supabase Storage** — photos are compressed in the browser (resized to 1600px, re-encoded as WebP) and uploaded straight to Supabase, never through the app server. All the upload logic lives in `lib/compressImage.js` (browser) and `lib/storage.js` (server).

## How it runs (locally)
- One command starts everything (`npm run dev`), one address in the browser (`localhost:3000`).
- The database and uploads live in the Supabase project — the same ones production uses, so a `.env` is required before it will start.
- Once students are actually using the live site, make a second free Supabase project for local work so testing doesn't touch their data.

## Suggested project shape
```
/app          the pages and API routes
/components   reusable UI pieces (PostCard, FeedItem, etc.)
/lib          database client, auth config, storage + compression helpers
/prisma       the schema (User, Post, Comment, Like, Follow)
/public       static files
```

## Live hosting
- **Vercel** (free Hobby plan), functions pinned to `sin1` (Singapore) so they sit next to the database.
- **Supabase** for Postgres, file storage, and the realtime chat bus.
- Full steps: `chindagram/DEPLOY.md`.
- Lock registration to approved school accounts before anyone real logs in.
