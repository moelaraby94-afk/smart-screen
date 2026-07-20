#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL="${DATABASE_URL:?DATABASE_URL not set}"
S3_BUCKET="${BACKUP_S3_BUCKET:-cloudscreen-backups}"
S3_PREFIX="db-backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/cloudscreen_$TIMESTAMP.dump"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting database backup..."

pg_dump "$DB_URL" --format=custom --file="$BACKUP_FILE"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Local backup created: $BACKUP_FILE"

if command -v aws &> /dev/null; then
  aws s3 cp "$BACKUP_FILE" \
    "s3://$S3_BUCKET/$S3_PREFIX/cloudscreen_$TIMESTAMP.dump"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Uploaded to s3://$S3_BUCKET/$S3_PREFIX/cloudscreen_$TIMESTAMP.dump"
else
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] AWS CLI not found — skipping S3 upload"
fi

find "$BACKUP_DIR" -name "cloudscreen_*.dump" -mtime +"$RETENTION_DAYS" -delete
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Cleaned up local backups older than $RETENTION_DAYS days"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup complete: cloudscreen_$TIMESTAMP.dump"
