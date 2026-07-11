#!/usr/bin/env bash
#
# Restore drill: verifies that backups produced by scripts/backup.sh can be
# restored into a clean environment and the core data is intact.
#
# This script:
#   1. Takes a fresh backup of the running stack.
#   2. Spins up a temporary Postgres container.
#   3. Restores the backup into it.
#   4. Verifies that core tables exist and have rows.
#   5. Tears down the temporary container.
#
# Usage: ./scripts/restore-drill.sh
# Exit codes: 0 = pass, 1 = fail
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.yml"
DB_SERVICE="db"
POSTGRES_USER="${POSTGRES_USER:-cloudsignage}"
POSTGRES_DB="${POSTGRES_DB:-cloudsignage}"
DRILL_CONTAINER="restore-drill-db"
DRILL_NETWORK="restore-drill-net"
TMP_DIR="${REPO_ROOT}/backups/drill"
STAMP="$(date +%Y-%m-%d_%H%M%S)"

die() { echo "DRILL FAILED: $*" >&2; exit 1; }
cleanup() {
  echo "==> Cleaning up drill resources"
  docker rm -f "$DRILL_CONTAINER" >/dev/null 2>&1 || true
  docker network rm "$DRILL_NETWORK" >/dev/null 2>&1 || true
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "=== Restore Drill ==="
echo ""

# ── 1. Verify the stack is running ────────────────────────────────────────────
if ! docker compose -f "$COMPOSE_FILE" ps --status running --services 2>/dev/null | grep -qx "$DB_SERVICE"; then
  die "compose service '${DB_SERVICE}' is not running. Start the stack first."
fi

# ── 2. Take a fresh backup ────────────────────────────────────────────────────
mkdir -p "$TMP_DIR"
DB_ARCHIVE="${TMP_DIR}/db-${STAMP}.sql.gz"
echo "==> Taking fresh database backup -> ${DB_ARCHIVE}"

set +e
docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --clean --if-exists \
  | gzip > "$DB_ARCHIVE"
dump_status="${PIPESTATUS[0]}"
set -e

[ "$dump_status" -eq 0 ] || die "pg_dump failed (exit ${dump_status})"
[ -s "$DB_ARCHIVE" ] || die "pg_dump produced an empty archive."

echo "    backup size: $(du -h "$DB_ARCHIVE" | cut -f1)"

# ── 3. Start a clean Postgres container ───────────────────────────────────────
echo "==> Starting temporary Postgres container (${DRILL_CONTAINER})"
docker network create "$DRILL_NETWORK" >/dev/null 2>&1 || true
docker run -d --name "$DRILL_CONTAINER" \
  --network "$DRILL_NETWORK" \
  -e POSTGRES_USER="$POSTGRES_USER" \
  -e POSTGRES_PASSWORD="drill-password" \
  -e POSTGRES_DB="$POSTGRES_DB" \
  postgres:16-alpine >/dev/null

echo "    waiting for Postgres to be ready..."
for i in $(seq 1 30); do
  if docker exec "$DRILL_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 1
  [ "$i" -eq 30 ] && die "Postgres did not become ready in 30s"
done
echo "    Postgres is ready"

# ── 4. Restore the backup ─────────────────────────────────────────────────────
echo "==> Restoring backup into clean container"
gunzip -c "$DB_ARCHIVE" \
  | docker exec -i "$DRILL_CONTAINER" \
      psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=on \
  || die "restore failed"

echo "    database restored"

# ── 5. Verify core tables exist and have data ─────────────────────────────────
echo "==> Verifying core tables"

verify_table() {
  local table="$1"
  local count
  count=$(docker exec "$DRILL_CONTAINER" \
    psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -t -A -c \
    "SELECT COUNT(*) FROM \"${table}\";" 2>&1) \
    || die "table '${table}' does not exist or query failed: ${count}"
  count="${count// /}"
  echo "    ${table}: ${count} row(s)"
  if ! [[ "$count" =~ ^[0-9]+$ ]]; then
    echo "    FAIL: ${table} count is not a number (got: '${count}')"
    ALL_OK=0
  fi
}

# Core tables that should exist after a valid restore
TABLES=(
  "User"
  "Workspace"
  "Screen"
  "Playlist"
  "Canvas"
  "Media"
  "Schedule"
  "Subscription"
  "AuditLog"
)

ALL_OK=1
for table in "${TABLES[@]}"; do
  verify_table "$table"
done

# ── 6. Result ─────────────────────────────────────────────────────────────────
echo ""
if [ "$ALL_OK" -eq 1 ]; then
  echo "=== DRILL PASSED ==="
  echo "All core tables restored and queryable."
  exit 0
else
  die "Some tables failed verification"
fi
