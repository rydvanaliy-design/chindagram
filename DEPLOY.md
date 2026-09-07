# Putting Chindagram online — Vercel + Supabase

The plan: the app runs on **Vercel** (free Hobby plan), the database and all
uploaded photos live on **Supabase** (free plan), both in **Singapore** so the
site is fast from Thailand. No server to patch, no SSH, no backup script.

> **Plan history.** An earlier version of this file used a free Oracle Cloud
> server. That still works and needs no code changes, but it means running and
> maintaining a Linux box. We chose Vercel + Supabase instead: nothing to
> administer, at the cost of a storage ceiling (below) and a one-off migration
> that is already done.

## The one limit that matters

Supabase's free plan includes about **1 GB of file storage**. That is the
ceiling this app will hit first — not bandwidth, not database size.

To make that last, every photo is **compressed in the browser before it is
uploaded**: resized to 1600px and re-encoded as WebP. A 2.4 MB phone photo comes
out around 220 KB, measured. That means roughly **4,500 photos per gigabyte**
instead of about 300.

Videos are **not** re-encoded — doing that in a browser needs a ~30 MB library
and fails on many iPhones — so they are capped at **15 MB** instead. A video
still costs as much space as ~70 photos, so they add up fast.

**The admin page shows current storage use**, with an amber warning at 70%.
Check it now and then. If it fills up, the options are archiving old posts or
Supabase Pro (about $25/month).

---

## Part 1 — Supabase (once, ~10 minutes)

1. Go to **supabase.com**, sign in, **New project**.
   - Region: **Southeast Asia (Singapore)**. This cannot be changed later and
     is what keeps the app fast from Thailand.
   - Set a database password and save it somewhere safe — you need it below.
2. **Storage → New bucket**
   - Name: exactly `uploads`
   - **Public bucket: ON.** (Filenames are random UUIDs, so URLs can't be
     guessed. This matches how the old `/uploads` folder worked.)
3. **Project Settings → API keys.** You need two values:
   - the **anon / public** key — safe to share
   - the **service_role** key — **secret**. It bypasses every access rule.
     Never commit it, never paste it into a chat, never put it in a variable
     whose name starts with `NEXT_PUBLIC_`.
4. **Project Settings → Database → Connection string.** Copy both the
   **Transaction pooler** (port 6543) and **Session/direct** (port 5432) URLs.

## Part 2 — Fill in `.env` on your Mac

Copy `.env.example` to `.env` if you haven't, then set:

| Variable | Where it comes from |
|---|---|
| `DATABASE_URL` | pooler string (port **6543**), password filled in |
| `DIRECT_URL` | direct string (port **5432**), password filled in |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `SUPABASE_STORAGE_BUCKET` | `uploads` |
| `AUTH_SECRET` | already set — **keep it**, it also secures chat channels |

Why two database URLs: Vercel runs every request in its own short-lived
function. Without the pooler, each one opens a fresh Postgres connection and
the database runs out within minutes. `DIRECT_URL` exists because
`prisma migrate` needs a real session the pooler can't give it.

Then create the tables:

```bash
npx prisma migrate deploy
```

Run the app locally to check it works:

```bash
npm run dev
```

## Part 3 — Vercel

1. Put the code on **GitHub** (private repo).
2. **vercel.com** → sign in with GitHub → **Add New Project** → pick the repo.
3. Under **Environment Variables**, add **every variable from your `.env`**,
   exactly the same names and values.
4. Deploy. Vercel reads `vercel.json`, which pins functions to `sin1`
   (Singapore) so they sit next to the database. Without that they default to
   the USA and every page load makes a round trip across the Pacific.
5. Open the deployed URL and **register first** — the first account is admin.

## Part 4 — Share it

- Make a QR code for the Vercel URL and put it up at school.
- Optional: a custom domain, free to attach in Vercel's dashboard.

## Backups

Supabase takes **daily database backups** on the free plan. Uploaded files are
not covered by those, so once there is content worth keeping, download a copy
from Storage now and then.

To back up the database yourself:

```bash
npx prisma db pull --print > backup-schema.prisma
```

---

## What lives where

| Thing | Where | Code |
|---|---|---|
| Pages and API | Vercel functions (Singapore) | `app/` |
| Database | Supabase Postgres | `prisma/schema.prisma` |
| Photos, videos, files | Supabase Storage, bucket `uploads` | `lib/storage.js` |
| Image compression | The student's browser, before upload | `lib/compressImage.js` |
| Live chat | Supabase Realtime broadcast | `lib/realtime.js` |
| Rate limits | Postgres table `RateHit` | `lib/ratelimit.js` |

### Notes for whoever maintains this next

- **Chat channel names are secret on purpose.** The browser subscribes with the
  public anon key, so if a channel were named after the conversation id (which
  is visible in the URL) anyone could listen in. The name is an HMAC of the
  conversation id under `AUTH_SECRET`, handed out only after membership is
  checked. Changing `AUTH_SECRET` silently breaks live chat until every open
  page reloads — the polling fallback keeps it working meanwhile.
- **Uploads never pass through the app server.** The browser asks
  `/api/uploads/sign` for a signed URL and sends the file straight to Supabase.
  Vercel caps request bodies at 4.5 MB, so a 15 MB video could not get through
  an API route at all.
- **Search needs `mode: "insensitive"`.** SQLite's `LIKE` was case-insensitive
  for free; Postgres's is not. Any new `contains:` search query needs it, or it
  will quietly stop matching `#Tag` against `#tag`.
- **The rate limiter fails open.** If the database is unreachable, requests are
  allowed rather than blocked — a database blip should not lock the whole school
  out of logging in.
