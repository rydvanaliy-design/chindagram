#!/usr/bin/env bash
# Fills the secret values into .env without them appearing anywhere else.
#
# Secrets are read with `read -s`, so they are never echoed to the screen, never
# written to your shell history, and never shown to Claude. Run it, paste when
# prompted, done.
#
#   bash scripts/setup-env.sh

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "No .env found. Copy .env.example to .env first:  cp .env.example .env"
  exit 1
fi

# Replace KEY=... in .env, whatever the current value is. Uses python rather
# than sed so that passwords containing / & @ etc. can't corrupt the file.
set_var() {
  KEY="$1" VALUE="$2" python3 - <<'PY'
import os, re
key, value = os.environ["KEY"], os.environ["VALUE"]
path = ".env"
lines = open(path).read().split("\n")
out, seen = [], False
for line in lines:
    if re.match(rf"^{re.escape(key)}=", line):
        out.append(f"{key}={value}")
        seen = True
    else:
        out.append(line)
if not seen:
    out.append(f"{key}={value}")
open(path, "w").write("\n".join(out))
PY
}

echo
echo "Chindagram — Supabase setup"
echo "Values you paste are hidden and stay on this machine."
echo

printf "Supabase project ref (e.g. abcdefghijklmnopqrst): "
read -r PROJECT_REF
[ -n "$PROJECT_REF" ] || { echo "Project ref is required."; exit 1; }

printf "Database region (press Enter for ap-southeast-1 / Singapore): "
read -r REGION
REGION="${REGION:-ap-southeast-1}"

printf "Database password (hidden): "
read -rs DB_PASSWORD; echo
[ -n "$DB_PASSWORD" ] || { echo "Password is required."; exit 1; }

printf "anon / public key (hidden): "
read -rs ANON_KEY; echo
[ -n "$ANON_KEY" ] || { echo "anon key is required."; exit 1; }

printf "service_role key (hidden): "
read -rs SERVICE_KEY; echo
[ -n "$SERVICE_KEY" ] || { echo "service_role key is required."; exit 1; }

if [ "$ANON_KEY" = "$SERVICE_KEY" ]; then
  echo
  echo "Those two keys are identical — you've probably pasted the same one twice."
  echo "Nothing was written. Run this again with the anon and service_role keys."
  exit 1
fi

# URL-encode the password: Postgres connection strings break on @ : / ? # etc.
DB_ENC=$(DB_PASSWORD="$DB_PASSWORD" python3 -c 'import os,urllib.parse;print(urllib.parse.quote(os.environ["DB_PASSWORD"], safe=""))')

HOST="aws-0-${REGION}.pooler.supabase.com"
set_var DATABASE_URL "postgresql://postgres.${PROJECT_REF}:${DB_ENC}@${HOST}:6543/postgres?pgbouncer=true&connection_limit=1"
set_var DIRECT_URL   "postgresql://postgres.${PROJECT_REF}:${DB_ENC}@${HOST}:5432/postgres"
set_var NEXT_PUBLIC_SUPABASE_URL "https://${PROJECT_REF}.supabase.co"
set_var NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON_KEY"
set_var SUPABASE_SERVICE_ROLE_KEY "$SERVICE_KEY"
set_var SUPABASE_STORAGE_BUCKET "uploads"

echo
echo "Written to .env (which git ignores)."
echo
echo "Next:"
echo "  node scripts/verify-supabase.mjs     # check it all works"
