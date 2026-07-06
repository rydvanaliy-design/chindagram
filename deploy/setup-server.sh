#!/usr/bin/env bash
# One-shot server setup for Chindagram on a fresh Ubuntu VM (Oracle Always Free).
# Run it ON THE SERVER, from inside the uploaded app folder:
#
#   cd /opt/chindagram && sudo bash deploy/setup-server.sh YOUR-SUBDOMAIN
#
# where YOUR-SUBDOMAIN is the DuckDNS name (without ".duckdns.org").
# Safe to re-run — every step is idempotent.
set -euo pipefail

SUBDOMAIN="${1:-}"
if [ -z "$SUBDOMAIN" ]; then
  echo "Usage: sudo bash deploy/setup-server.sh YOUR-SUBDOMAIN   (the DuckDNS name)"
  exit 1
fi
APP_DIR="/opt/chindagram"
if [ ! -f "$APP_DIR/package.json" ]; then
  echo "Expected the app at $APP_DIR (package.json not found there)."
  exit 1
fi

echo "==> 1/7 Opening web ports in the OS firewall (Oracle images block them by default)"
iptables -C INPUT -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null \
  || iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -C INPUT -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null \
  || iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save 2>/dev/null || true

echo "==> 2/7 Installing Node.js 22, sqlite3 (for backups), and basics"
if ! command -v node >/dev/null || [ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y sqlite3

echo "==> 3/7 Installing Caddy (automatic HTTPS)"
if ! command -v caddy >/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update && apt-get install -y caddy
fi
sed "s/YOUR-SUBDOMAIN/$SUBDOMAIN/" "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

echo "==> 4/7 App environment (.env)"
cd "$APP_DIR"
if [ ! -f .env ]; then
  cat > .env <<EOF
DATABASE_URL="file:./dev.db"
AUTH_SECRET="$(openssl rand -base64 32)"
EOF
  echo "    Created .env with a fresh AUTH_SECRET."
else
  echo "    .env already exists — leaving it alone."
fi
chown -R ubuntu:ubuntu "$APP_DIR"

echo "==> 5/7 Installing dependencies, creating the database, building"
sudo -u ubuntu bash -c "cd $APP_DIR && npm ci && npx prisma migrate deploy && npm run build"

echo "==> 6/7 Registering the app as a service (starts on boot, restarts on crash)"
cp "$APP_DIR/deploy/chindagram.service" /etc/systemd/system/chindagram.service
systemctl daemon-reload
systemctl enable chindagram
systemctl restart chindagram

echo "==> 7/7 Nightly backups (2:00 AM, kept 14 days, in $APP_DIR/backups)"
chmod +x "$APP_DIR/scripts/backup.sh"
cat > /etc/cron.d/chindagram-backup <<EOF
0 2 * * * ubuntu $APP_DIR/scripts/backup.sh >> $APP_DIR/backups/backup.log 2>&1
EOF

echo ""
echo "All done. Chindagram should now be live at: https://$SUBDOMAIN.duckdns.org"
echo "The FIRST account created on the site becomes the admin — go claim it now."
