#!/usr/bin/env bash
#
# Full-stack backup: everything that cannot be rebuilt from the git repository.
#
#   1. PostgreSQL  — users, workspaces, subscriptions, screens, playlists, audit log
#   2. media_uploads volume — customer-uploaded images/video
#   3. backend_data volume  — .data/ (platform settings, branding assets)
#
# The previous script covered only (2). Losing (1) loses the entire product;
# losing (3) loses platform branding and settings. All three are restored by
# `scripts/restore.sh`.
#
# Safe to run against a live stack: pg_dump takes a consistent snapshot inside a
# transaction, and the volumes are mounted read-only.
#
# Usage: ./scripts/backup.sh [output-dir]
#   RETENTION_DAYS=14 ./scripts/backup.sh   # prune archives older than 14 days
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${1:-${REPO_ROOT}/backups}"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
RETENTION_DAYS="${RETENTION_DAYS:-0}"

DB_SERVICE="db"
MEDIA_VOLUME="smart_screen_media_uploads"
DATA_VOLUME="smart_screen_backend_data"

POSTGRES_USER="${POSTGRES_USER:-smartscreen}"
POSTGRES_DB="${POSTGRES_DB:-smartscreen}"

die() { echo "Error: $*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || die "docker is not installed or not on PATH."
mkdir -p "$BACKUP_DIR"

# ── 1. Database ───────────────────────────────────────────────────────────────
# --clean --if-exists makes the dump replayable onto a non-empty database.
DB_ARCHIVE="${BACKUP_DIR}/db-${STAMP}.sql.gz"
echo "==> Dumping database '${POSTGRES_DB}' -> ${DB_ARCHIVE}"

if ! docker compose -f "${REPO_ROOT}/docker-compose.yml" ps --status running --services 2>/dev/null | grep -qx "$DB_SERVICE"; then
  die "compose service '${DB_SERVICE}' is not running. Start the stack first (docker compose up -d)."
fi

# `set -e` would abort before the cleanup below, so the pipeline's status is
# captured explicitly. PIPESTATUS[0] is pg_dump's own status, not gzip's.
set +e
docker compose -f "${REPO_ROOT}/docker-compose.yml" exec -T "$DB_SERVICE" \
  pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --clean --if-exists \
  | gzip > "$DB_ARCHIVE"
dump_status="${PIPESTATUS[0]}"
set -e

if [ "$dump_status" -ne 0 ]; then
  rm -f "$DB_ARCHIVE"
  die "pg_dump failed (exit ${dump_status}); removed the partial archive."
fi
[ -s "$DB_ARCHIVE" ] || { rm -f "$DB_ARCHIVE"; die "pg_dump produced an empty archive."; }

# ── 2 & 3. Named volumes ──────────────────────────────────────────────────────
backup_volume() {
  local volume="$1" label="$2"
  local archive="${BACKUP_DIR}/${label}-${STAMP}.tar.gz"

  if ! docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "    skip: volume '${volume}' does not exist yet"
    return 0
  fi

  echo "==> Archiving volume '${volume}' -> ${archive}"
  docker run --rm \
    -v "${volume}:/data:ro" \
    -v "${BACKUP_DIR}:/backup" \
    alpine:3.20 \
    tar czf "/backup/$(basename "$archive")" -C /data .
}

backup_volume "$MEDIA_VOLUME" "uploads"
backup_volume "$DATA_VOLUME" "backend-data"

# ── Retention ─────────────────────────────────────────────────────────────────
if [ "$RETENTION_DAYS" -gt 0 ]; then
  echo "==> Pruning archives older than ${RETENTION_DAYS} day(s)"
  find "$BACKUP_DIR" -maxdepth 1 -type f \
    \( -name 'db-*.sql.gz' -o -name 'uploads-*.tar.gz' -o -name 'backend-data-*.tar.gz' \) \
    -mtime "+${RETENTION_DAYS}" -print -delete
fi

echo
echo "Backup complete — ${BACKUP_DIR}"
ls -lh "$BACKUP_DIR" | grep -- "$STAMP" || true
