# Putting Chindagram online — free, fast, and safe

The plan: a **free forever cloud server** from Oracle (their "Always Free" tier),
in **Singapore** (about 30 ms from Thailand, so no lag), with a free web address
from **DuckDNS** and automatic HTTPS. The app runs on it exactly as it runs on
your Mac — same database, same photo storage, same instant chat. Nothing in the
code has to change, and nothing costs money.

> Why not Vercel/Netlify-style hosting? Those hosts wipe their disk between
> requests and don't hold long-lived connections — your photos/videos would
> need a paid file service and live chat would silently become slow polling.
> A real (free) server avoids both problems.

You do three things yourself (accounts can only be created by you); every
technical step after that is one script.

---

## Part 1 — Create the free server (about 20 minutes, once)

1. Go to **oracle.com/cloud/free** → "Start for free".
   - Sign up with your email. It asks for a **credit/debit card for identity
     verification only** — Always Free resources never charge it.
   - For "Home Region" choose **Singapore** (ap-singapore-1). This cannot be
     changed later and is what keeps the site fast from Thailand.
2. Once you're in the console: **Menu → Compute → Instances → Create instance**.
   - Name: `chindagram`
   - Image: **Ubuntu 24.04** (Canonical Ubuntu)
   - Shape: click "Change shape" → **Ampere → VM.Standard.A1.Flex** →
     set **2 OCPUs and 12 GB memory** (well inside the free allowance).
   - Under "Add SSH keys": choose **Generate a key pair for me** and
     **download the private key file** — keep it safe, it's how you log in.
   - Create. After a minute it shows a **Public IP address** — copy it.
3. Open the ports so the internet can reach it:
   - On the instance page click its **subnet** → **Default Security List** →
     **Add Ingress Rules**. Add two rules, both with Source CIDR `0.0.0.0/0`,
     protocol TCP: one with destination port **80**, one with port **443**.

## Part 2 — Get the free web address (2 minutes)

1. Go to **duckdns.org**, sign in (Google works).
2. Type a subdomain — e.g. `chindagram` → you get **chindagram.duckdns.org**.
3. In the "current ip" box, paste the server's **Public IP** and click update.

(That address is what the school's QR code will point to.)

## Part 3 — Upload the app and run the setup script

On your Mac, in Terminal (replace the CAPITALS — `KEY.key` is the file you
downloaded in Part 1, `IP` is the public IP):

```bash
# 1. Send the app to the server (first time only; takes a few minutes)
chmod 600 ~/Downloads/KEY.key
rsync -az -e "ssh -i ~/Downloads/KEY.key" \
  --exclude node_modules --exclude .next --exclude .env \
  --exclude prisma/dev.db --exclude public/uploads --exclude backups \
  "/Users/rydvanaliyessimkhan/Desktop/Claude instagram/chindagram/" ubuntu@IP:/tmp/chindagram/

# 2. Log in to the server
ssh -i ~/Downloads/KEY.key ubuntu@IP

# 3. On the server — move the app into place and run setup
sudo mkdir -p /opt && sudo mv /tmp/chindagram /opt/chindagram
cd /opt/chindagram && sudo bash deploy/setup-server.sh YOUR-SUBDOMAIN
```

The script installs everything (Node, the HTTPS proxy, the always-on service,
nightly backups) and ends with your live address:
**https://YOUR-SUBDOMAIN.duckdns.org**

**Immediately open it and register — the first account becomes the admin.**
The server starts with an empty database; you're not copying test data from
your Mac, you're starting the real school site fresh.

## Part 4 — Share it

Make a QR code that points to your `https://…duckdns.org` address (any free QR
generator) and put it up at school. Done.

---

## Already handled for you (safety & speed)

- **HTTPS everywhere** — automatic certificate, auto-renewing.
- **Rate limiting** on sign-up (5/hour per address), login attempts, posting,
  messaging, uploads, and reports — spam and brute-force are throttled.
- Passwords hashed, admin actions checked server-side, disabled accounts locked
  out instantly, site invisible to search engines.
- **Nightly backups** at 2 AM (database + all photos), kept 14 days, in
  `/opt/chindagram/backups`. Once a month, copy the newest pair to your Mac:
  ```bash
  scp -i ~/Downloads/KEY.key "ubuntu@IP:/opt/chindagram/backups/db-*.sqlite" ~/Desktop/
  ```
- The app restarts itself if it crashes, and starts on its own if the server
  reboots.

## Updating the app later

When the code changes on your Mac, re-run the `rsync` command from Part 3
(step 1), then on the server:

```bash
cd /opt/chindagram && bash deploy/update.sh
```

## Good to know

- **Keep the site in use.** Oracle can reclaim Always Free servers that sit
  completely idle for a week — a school app used daily is fine.
- **AI helpers** (caption suggestions, translation) stay hidden until you add
  an `ANTHROPIC_API_KEY` line to `/opt/chindagram/.env` — that one feature is
  pay-per-use, everything else stays free.
- If the site is ever unreachable: log in via ssh, then
  `sudo systemctl restart chindagram` — and `sudo systemctl status chindagram`
  shows what happened.
