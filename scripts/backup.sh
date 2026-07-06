#!/usr/bin/env bash
# Nightly backup: a consistent snapshot of the database plus all uploaded
# files, kept for 14 days. Installed as a cron job by deploy/setup-server.sh.
#
# The DB copy uses sqlite3's .backup (safe while the app is running) — never
# plain `cp` on a live SQLite file.
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$APP_DIR/backups"
STAMP="$(date +%Y%m%d-%H%M)"
mkdir -p "$BACKUP_DIR"

sqlite3 "$APP_DIR/prisma/dev.db" ".backup '$BACKUP_DIR/db-$STAMP.sqlite'"
tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$APP_DIR/public" uploads

# retention: delete backups older than 14 days
find "$BACKUP_DIR" -name 'db-*.sqlite' -mtime +14 -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +14 -delete

echo "$(date -Is) backup ok: db-$STAMP.sqlite + uploads-$STAMP.tar.gz"
