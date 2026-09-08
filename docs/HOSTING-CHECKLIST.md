# Goal: Chindagram running online, permanently, safe for the school

Plan changed (2026-09-07): **Vercel + Supabase**, both in Singapore, instead of
an Oracle Cloud server. Nothing to administer — no SSH, no Linux patching, no
backup cron. Full step-by-step: **chindagram/DEPLOY.md**.

The trade: Supabase's free plan gives ~1 GB of file storage, so every photo is
now compressed in the browser before upload (2.4 MB → ~220 KB, measured), and
videos are capped at 15 MB. That's ~4,500 photos per free gigabyte. The admin
page shows how full it is and warns at 70%.

## Part A — Works on my own computer
- [x] 1. Install Node.js
- [x] 2. Run Chindagram locally, admin account made, posting works

## Part B — Migrate the code (done for me)
- [x] 3. Database moved from SQLite to Postgres
- [x] 4. Uploads moved to Supabase Storage, browser-side compression added
- [x] 5. Live chat moved to Supabase Realtime
- [x] 6. Rate limiting moved into the database

## Part C — Put it online (all steps in DEPLOY.md)
- [ ] 7. Create the Supabase project (**Singapore region**) — Part 1
- [ ] 8. Create the `uploads` storage bucket, set it Public — Part 1
- [ ] 9. Fill in `.env` with the keys and database password — Part 2
- [ ] 10. `npx prisma migrate deploy` to create the tables — Part 2
- [ ] 11. Push the code to a private GitHub repo — Part 3
- [ ] 12. Connect the repo to Vercel, paste in the env vars, deploy — Part 3
- [ ] 13. Open the live site and register FIRST (first account = admin)

## Part D — Share it
- [ ] 14. Make the QR code for the live address and put it up at school
- [ ] 15. Check the admin storage bar now and then

Already handled in the app itself: HTTPS, sign-up/login/post rate limiting,
hashed passwords, auto-scaling, daily database backups from Supabase.
Sign-up stays open by my decision — the QR link is the gate.

Notes (what I learned, one line per step):
-
