#!/usr/bin/env bash
# Update the live app after uploading new code (see DEPLOY.md "Updating later").
# Run ON THE SERVER:  cd /opt/chindagram && bash deploy/update.sh
set -euo pipefail
cd /opt/chindagram
npm ci
npx prisma migrate deploy
npm run build
sudo systemctl restart chindagram
echo "Updated and restarted."
