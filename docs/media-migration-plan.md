# Media Migration Plan: Local → S3

> **Status:** Plan only — no implementation yet.  
> **Prerequisite:** Phase 1 fixes complete, `MEDIA_STORAGE_PROVIDER=s3` configured.  
> **Risk:** Existing media files in `uploads/media/` will be inaccessible after switching to S3.

---

## 1. Overview

When switching `MEDIA_STORAGE_PROVIDER` from `local` to `s3`, all existing media files stored on the local filesystem (`uploads/media/<workspaceId>/<file>`) must be migrated to the S3-compatible bucket. This document describes the migration script, rollback procedure, and verification steps.

---

## 2. Files Required

| # | File | Purpose |
|---|------|---------|
| 1 | `scripts/migrate-uploads-to-s3.ts` | Migration script — copies files from local `uploads/media/` to S3 bucket |
| 2 | `scripts/verify-s3-migration.ts` | Verification script — compares local file list with S3 object list |
| 3 | `.env` (updated) | Set `MEDIA_STORAGE_PROVIDER=s3` and S3 credentials |

---

## 3. Migration Script Design (`migrate-uploads-to-s3.ts`)

### 3.1 Inputs
- `UPLOADS_DIR` — local directory root (default: `./uploads/media`)
- `S3_BUCKET` — target bucket name
- `S3_ENDPOINT` — S3-compatible endpoint (AWS, MinIO, R2)
- `S3_REGION` — region
- `S3_ACCESS_KEY` / `S3_SECRET_KEY` — credentials
- `DRY_RUN` — if `true`, list files that would be migrated without uploading
- `BATCH_SIZE` — concurrent upload batch size (default: 10)

### 3.2 Process
1. Scan `UPLOADS_DIR` recursively for all files (excluding `.part` files)
2. For each file, compute the S3 key by stripping the `UPLOADS_DIR` prefix
3. Check if the object already exists in S3 (via `HeadObject`)
4. If not, upload the file via `PutObject`
5. Log progress: `[x/total] Uploaded <key>`
6. On error, log and continue (don't abort the entire migration)
7. At the end, print summary: total files, uploaded, skipped (already existed), failed

### 3.3 Safety Features
- **Dry run mode:** `DRY_RUN=true` lists files without uploading
- **Skip existing:** Don't overwrite objects that already exist in S3
- **Resume support:** If the script is interrupted, re-running it skips already-migrated files
- **No database changes:** The script only moves files — `relativePath` in the DB remains the same (it's already workspace-relative)
- **Exclude `.part` files:** Incomplete uploads are never migrated

### 3.4 Usage
```bash
# Dry run first
DRY_RUN=true npx tsx scripts/migrate-uploads-to-s3.ts

# Actual migration
npx tsx scripts/migrate-uploads-to-s3.ts

# Verify
npx tsx scripts/verify-s3-migration.ts
```

---

## 4. Verification Script Design (`verify-s3-migration.ts`)

### 4.1 Process
1. Scan local `uploads/media/` for all files
2. For each file, check if the corresponding S3 object exists via `HeadObject`
3. Report: total local files, found in S3, missing in S3
4. If any missing, exit with code 1

---

## 5. Rollback Plan

### 5.1 Before Migration
1. **Backup:** Create a tarball of `uploads/media/`:
   ```bash
   tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/media/
   ```
2. **Snapshot DB:** Record current `MEDIA_STORAGE_PROVIDER` value:
   ```sql
   -- No schema change needed, just note the current value
   SELECT count(*) FROM media;
   ```

### 5.2 Rollback Steps
If migration fails or S3 is not working correctly:

1. Set `MEDIA_STORAGE_PROVIDER=local` in `.env`
2. Restart the backend service
3. Verify media files are accessible from local storage
4. The local files are never deleted during migration — they remain in place
5. If local files were deleted (not recommended), restore from the tarball backup:
   ```bash
   tar -xzf uploads-backup-YYYYMMDD.tar.gz
   ```

### 5.3 Post-Migration Cleanup
Only after verifying S3 works correctly for at least 7 days:
1. Delete the local `uploads/media/` directory
2. Remove the `media_uploads` Docker volume from `docker-compose.yml`
3. Remove the static asset serving code from `main.ts` (the `if (storageProvider === 'local')` block)

---

## 6. Execution Checklist

- [ ] Configure S3 credentials in `.env`
- [ ] Test S3 connectivity with a manual upload
- [ ] Create local backup tarball
- [ ] Run migration script in dry-run mode
- [ ] Review dry-run output (file count, total size)
- [ ] Run migration script
- [ ] Run verification script
- [ ] Switch `MEDIA_STORAGE_PROVIDER=s3` in `.env`
- [ ] Restart backend
- [ ] Test media upload, list, delete, and duplicate flows
- [ ] Test media URL accessibility from dashboard and player
- [ ] Monitor for 7 days
- [ ] Clean up local files (optional, after 7-day monitoring)
