# Tech Stack: Chindamanee Social

Chosen for: you already know JavaScript and Node, it runs on your machine with almost no setup, and it has a clean path to going live later without a rewrite.

## The stack
- **Next.js (App Router)** — frontend and backend in one framework. Pages for the UI, built-in API routes for the server. One thing to learn, one thing to run, one thing to deploy.
- **Tailwind CSS** — styling. Fast to build an Instagram-like look, and Claude handles it well.
- **Prisma + SQLite** — the database. SQLite is a single file on your machine, zero setup, perfect for a prototype. Prisma is the layer your code uses to read and write it. When you go live, Prisma swaps SQLite for Postgres with a small config change, not a rewrite.
- **Auth.js (NextAuth), credentials provider** — email + password login. Use the library, do not hand-roll password security. This matters more here because real students' accounts are involved.
- **Image uploads: local folder for now** — uploaded photos save to a folder on disk and are served from there. When you go live, this swaps to a real image host (Cloudinary or an S3-compatible store). Keep upload logic in one place so the swap is easy.

## How it runs (local prototype)
- One command starts everything (`npm run dev`), one address in the browser (`localhost:3000`).
- The database is one file in the project. Delete it to start fresh.
- No accounts on the internet, no hosting bill, nothing public while you build.

## Suggested project shape
```
/app          the pages and API routes
/components   reusable UI pieces (PostCard, FeedItem, etc.)
/lib          database client, auth config, upload helper
/prisma       the schema (User, Post, Comment, Like, Follow)
/public        static files; /public/uploads holds posted images for now
```

## The path to live (step 11, later)
- Swap SQLite for Postgres in Prisma.
- Swap local image folder for a real image host.
- Deploy on Vercel (made by the Next.js team, fits this stack).
- Lock registration to approved school accounts before anyone real logs in.
