# Putting Chindagram online — permanently and safely

Right now the app runs great **on your computer**. To keep it online 24/7 for the school, two things have to change, because a normal web host wipes its local disk between runs:

1. The **database** moves from the local file (SQLite) to a hosted database (Postgres).
2. **Photos** move from the local `/public/uploads` folder to a cloud image store.

Everything else stays the same. Below is the whole path in plain steps. The free tiers are enough to start; you only pay if it gets big.

---

## Step 1 — Move the database to Postgres (free: Neon or Supabase)

1. Make a free account at **neon.tech** (or supabase.com) and create a database. Copy its connection string (looks like `postgresql://user:pass@host/dbname`).
2. In `prisma/schema.prisma`, change one line:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. Put the connection string in your environment as `DATABASE_URL`.
4. Run `npx prisma migrate deploy` (or `npx prisma migrate dev` the first time) to build the tables.

That's the whole database swap — Prisma handles the rest, no code rewrite.

## Step 2 — Move photos to a cloud store (free: Cloudinary)

Photos must NOT be saved to the local folder online (the disk resets and they'd vanish). All the upload logic is already isolated in **one file**, `lib/upload.js`, so this is a small change.

1. Make a free **cloudinary.com** account. Note your cloud name, API key, and API secret. Create an "unsigned upload preset" (or use signed uploads).
2. Replace the body of `saveImage()` in `lib/upload.js` with an upload to Cloudinary, e.g.:
   ```js
   export async function saveImage(file) {
     // ...keep the type + size checks...
     const form = new FormData();
     form.append("file", file);
     form.append("upload_preset", process.env.CLOUDINARY_PRESET);
     const res = await fetch(
       `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD}/image/upload`,
       { method: "POST", body: form }
     );
     const data = await res.json();
     return data.secure_url; // the public image URL the app stores
   }
   ```
3. Add `CLOUDINARY_CLOUD` and `CLOUDINARY_PRESET` to your environment.

Because the app just stores whatever URL `saveImage` returns, nothing else needs to change.
(Alternative: **Vercel Blob** — even simpler if you host on Vercel — needs the `@vercel/blob` package.)

## Step 3 — Host it on Vercel (made by the Next.js team, free tier)

1. Put the project on **GitHub** (a private repo).
2. At **vercel.com**, "Import Project" and pick that repo.
3. In Vercel's project settings → Environment Variables, add:
   - `DATABASE_URL` (from Step 1)
   - `AUTH_SECRET` (generate a fresh one: run `openssl rand -base64 32`)
   - `CLOUDINARY_CLOUD`, `CLOUDINARY_PRESET` (from Step 2)
4. Click Deploy. Vercel gives you a permanent `https://…vercel.app` address (you can add a custom domain later). HTTPS and secure login cookies are automatic.

After the first deploy, every time you push to GitHub it redeploys itself.

---

## Safety & security — what's already done, and what to add before real students

**Already in the build**
- Passwords are hashed with bcrypt (never stored in plain text).
- Login handled by Auth.js; sessions are signed with your secret `AUTH_SECRET`.
- A **disabled account is locked out immediately** — every action re-checks the database, not just the old login cookie.
- Admin tools (remove post/comment, disable account) are **checked on the server** — a normal user can't call them even by hand.
- The site is marked **noindex** (search engines won't list it) and sends standard security headers (no iframe embedding, no content-type guessing).
- Uploads are limited to images, max 8 MB.

**Add before opening to real students (important with minors)**
- **Lock sign-up to approved school accounts.** Today anyone with the link can register. Add an allowlist: a table (or simple list) of approved school emails, and reject `/api/register` if the email isn't on it. This is the single most important pre-launch change.
- **Rate limiting** to stop spam/abuse (e.g., limit logins and posts per minute). Easiest add-on: Upstash Redis with `@upstash/ratelimit` — free tier, a few lines in each API route.
- **Database backups** — turn on automatic backups in Neon/Supabase (one toggle).
- **A real admin handover** — the first sign-up becomes admin; once you're set up, you can promote/demote others (a small change to the admin page when you want it).

## Speed — keeping it from getting laggy

**Already done**
- Database **indexes** on the columns the app filters and sorts by (feed by author+date, follows, comments, likes, reports) — keeps queries fast as data grows.
- The **feed loads the 30 newest posts**, not everything, so it stays quick. (A "load more" button can extend this later.)
- Likes and follows update **instantly in the browser** (optimistic), then confirm with the server.

**Worth adding as it grows**
- Serve resized/compressed images (Cloudinary can do this automatically by adding transform options to the URL) so big photos don't slow phones on school wifi.
- "Load more"/infinite scroll on the feed once there are lots of posts.
- Notifications and Search are planned for v2 — both want their own indexes too.

---

### Quick summary
Local now = SQLite + local photos. Online permanently = **Postgres + Cloudinary + Vercel**, plus **lock sign-up to school emails** before any real student joins. The code is structured so each of those is a small, contained change — not a rewrite.
