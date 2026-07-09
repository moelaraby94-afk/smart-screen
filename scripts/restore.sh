#!/usr/bin/env bash
#
# Restores a backup produced by `scripts/backup.sh`.
#
# An untested backup is not a backup — run this against a scratch stack at least
# once before you need it.
#
# Usage:
#   ./scripts/restore.sh backups/db-2026-07-09_120000.sql.gz
#   ./scripts/restore.sh backups/db-<stamp>.sql.gz backups/uploads-<stamp>.tar.gz backups/backend-data-<stamp>.tar.gz
#
# DESTRUCTIVE: the database dump is taken with --clean, so replaying it drops and
# recreates every table. Volume restores overwrite existing files in place.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.yml"

DB_SERVICE="db"
MEDIA_VOLUME="cloud_screen_media_uploads"
DATA_VOLUME="cloud_screen_backend_data"

POSTGRES_USER="${POSTGRES_USER:-cloudsignage}"
POSTGRES_DB="${POSTGRES_DB:-cloudsignage}"

die() { echo "Error: $*" >&2; exit 1; }
usage() { sed -n '2,14p' "$0"; exit 1; }

[ $# -ge 1 ] || usage
command -v docker >/dev/null 2>&1 || die "docker is not installed or not on PATH."

confirm() {
  if [ "${FORCE:-0}" = "1" ]; then return 0; fi
  printf 'This will OVERWRITE the running stack'"'"'s data. Type "restore" to continue: '
  read -r reply
  [ "$reply" = "restore" ] || die "Aborted."
}

restore_database() {
  local archive="$1"
  [ -f "$archive" ] || die "no such file: ${archive}"

  echo "==> Restoring database from ${archive}"
  gunzip -c "$archive" \
    | docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
        psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=on

  # psql is last in the pipe, so $? is already its status under `set -o pipefail`.
  echo "    database restored"
}

restore_volume() {
  local archive="$1" volume="$2"
  [ -f "$archive" ] || die "no such file: ${archive}"

  docker volume inspect "$volume" >/dev/null 2>&1 || docker volume create "$volume" >/dev/null

  echo "==> Restoring volume '${volume}' from ${archive}"
  docker run --rm \
    -v "${volume}:/data" \
    -v "$(cd "$(dirname "$archive")" && pwd):/backup:ro" \
    alpine:3.20 \
    tar xzf "/backup/$(basename "$archive")" -C /data
}

confirm

for archive in "$@"; do
  case "$(basename "$archive")" in
    db-*.sql.gz)           restore_database "$archive" ;;
    uploads-*.tar.gz)      restore_volume "$archive" "$MEDIA_VOLUME" ;;
    backend-data-*.tar.gz) restore_volume "$archive" "$DATA_VOLUME" ;;
    *) die "unrecognized archive name: $(basename "$archive")" ;;
  esac
done

echo
echo "Restore complete. Restart the stack so the backend picks up the restored volumes:"
echo "  docker compose -f ${COMPOSE_FILE} restart backend"
