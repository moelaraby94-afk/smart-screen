# 10 — Storage & Media Audit

> **Objective:** Evaluate the media storage strategy, file handling, upload limits, CDN integration, and storage quota enforcement.

---

## 1. Current State

Media storage is implemented in `domains/media/media.service.ts` (593 lines). Files are stored on the **local filesystem** under `uploads/media/:workspaceId/`. The API process serves these files statically via Express under the `/media-files/` prefix.

---

## 2. What Exists

### Upload Configuration
- **Storage:** Local filesystem, `memoryStorage()` from Multer (file buffered in RAM before writing to disk)
- **Max file size:** 150MB (`MAX_BYTES = 150 * 1024 * 1024`)
- **Allowed MIME types:** JPEG, PNG, GIF, WebP, MP4, WebM, QuickTime
- **Upload directory:** `MEDIA_UPLOAD_DIR` env var, default `uploads/media/`
- **Public base URL:** `MEDIA_PUBLIC_BASE_URL` env var, default `http://localhost:{PORT}`

### File Storage Flow
1. File received by Multer in memory (`FileInterceptor` with `memoryStorage()`)
2. `MediaService.saveUploadedFile()` generates UUID filename
3. Creates directory: `uploads/media/:workspaceId/`
4. Writes file to disk: `uploads/media/:workspaceId/:uuid.:ext`
5. Creates `Media` DB record with `relativePath`, `mimeType`, `sizeBytes`, `ownerId`, `workspaceId`, `folderId`
6. Returns media response with public URL

### URL Construction
- `buildPublicUrl(relativePath)` — Constructs absolute URL:
  - Base: `MEDIA_PUBLIC_BASE_URL` (or `http://localhost:PORT`)
  - Prefix: `/media-files/`
  - Path: relative path from `uploads/` to `uploadRoot` + `relativePath`
  - Each segment URL-encoded
- Example: `https://api.example.com/media-files/media/ws_abc/uuid.jpg`

### Storage Quota
- `Subscription.storageLimitBytes` (BigInt) — Per-workspace storage limit
- Before upload: `MediaService` sums `sizeBytes` for all media in workspace
- If `existingBytes + newFileSize > storageLimitBytes` → throws `STORAGE_LIMIT_REACHED` with details
- Default limits: FREE (5GB), STARTER/PRO (50GB), ENTERPRISE (custom)

### Folder Management
- `MediaFolder` model with `name`, `ownerId`, `workspaceId`, unique name per owner
- CRUD: list, create, rename, delete
- Move media to folder: `PATCH /media/:id/folder`
- Delete folder: unbinds media (sets `folderId = null`), doesn't delete media files

### Media Operations
- **List:** Paginated with `PaginationQueryDto`, filter by `folderId`, `mimeType`, `search`
- **Stats:** `GET /media/stats` — Total count, total size, by type breakdown
- **Delete:** Removes DB record + deletes file from disk
- **Expiry:** `PATCH /media/:id/expiry` — Sets `expiresAt` date
- **In-use check:** `MEDIA_IN_USE` error if media is referenced by a playlist item

### Static File Serving
- `main.ts` registers: `app.useStaticAssets('uploads', { prefix: '/media-files/' })`
- Express serves files directly from disk
- No authentication on static files — anyone with the URL can access media
- No rate limiting on static file downloads

---

## 3. What Is Missing

1. **No S3/MinIO/object storage** — Files are on local disk. Not suitable for containerized deployments (ephemeral filesystem) or multi-instance setups.

2. **No CDN integration** — Media is served directly from the API process. No CloudFront, Cloudflare, or CDN in front.

3. **No image processing** — No thumbnail generation, no resize/crop, no format conversion. Original file is always served.

4. **No video transcoding** — Videos are served at original quality. No HLS/DASH adaptive streaming.

5. **No virus scanning** — Uploaded files are not scanned for malware. A malicious file could be stored and served.

6. **No file content validation** — MIME type is determined from file extension (`file.mimetype` from Multer), not from file content. Extension can be spoofed.

7. **No media access control** — Static files are publicly accessible. No signed URLs, no token-based access. Anyone with the URL can download media.

8. **No upload resumption** — No chunked upload or resumable upload for large files. A 150MB upload that fails at 90% must restart from scratch.

9. **No storage usage dashboard** — `GET /media/stats` exists but no endpoint shows storage quota usage percentage or remaining space.

10. **No automatic cleanup** — When media is deleted from DB, the file is deleted from disk. But if the DB delete fails after file delete, or vice versa, there's no reconciliation. No orphaned file cleanup cron job.

11. **No EXIF stripping** — Uploaded images retain EXIF data including GPS coordinates. Privacy risk.

12. **No watermarking** — No automatic watermarking for branded content.

---

## 4. Problems

1. **Memory buffering for 150MB files** — `memoryStorage()` loads the entire file into RAM before writing to disk. Concurrent uploads of large files could cause OOM (Out of Memory) crashes.

2. **Static files served by API process** — The API process handles both REST requests and static file serving. Large file downloads consume API process resources.

3. **No disk space monitoring** — No check for available disk space before writing. A full disk will cause upload failures with confusing error messages.

4. **URL construction fragility** — `buildPublicUrl()` derives the path from `relative(staticRoot, uploadRoot)`. If `MEDIA_UPLOAD_DIR` is changed, existing URLs break.

5. **No file integrity check** — No checksum/hash stored. Can't verify file integrity after upload or detect corruption.

6. **Media deletion is not transactional** — File is deleted from disk, then DB record is deleted. If DB delete fails, the file is already gone but the DB still references it.

---

## 5. Risks

- **Critical: Local filesystem in containers** — Docker/K8s ephemeral filesystem means media is lost on container restart.
- **High: No access control on media** — Public URLs expose media to anyone. Competitors could scrape content.
- **High: Memory buffering for large files** — OOM risk under concurrent upload load.
- **Medium: No virus scanning** — Malware storage and distribution risk.
- **Medium: EXIF data** — Privacy violation for user-uploaded images.
- **Low: No file integrity** — Silent corruption undetectable.

---

## 6. Priority: **Medium**

Media storage works for development but is not production-ready. S3 integration is the most critical gap.

---

## 7. Completion Percentage: **70%**

Upload, storage, folders, expiry, quota enforcement, and stats are implemented. Missing: S3, CDN, thumbnails, transcoding, virus scanning, access control, resumable uploads, EXIF stripping.

---

## 8. Recommendations

1. Implement S3/MinIO storage adapter with `MEDIA_STORAGE_PROVIDER` env var (local/s3/minio)
2. Switch from `memoryStorage()` to `diskStorage()` or S3 presigned URL upload (client uploads directly to S3)
3. Add signed URL generation for media access: URLs expire after 1 hour, require valid JWT
4. Add image processing pipeline: generate thumbnails (100px, 400px, 800px), strip EXIF, convert to WebP
5. Add video transcoding: generate HLS manifest + multiple quality levels (using FFmpeg or AWS MediaConvert)
6. Add virus scanning: scan uploaded files with ClamAV or AWS GuardDuty Malware Protection
7. Add file content type detection using `file-type` library (sniff from content, not extension)
8. Add file hash (SHA-256) to Media model for integrity verification
9. Add storage usage endpoint: `GET /media/storage-usage` returning `{ usedBytes, limitBytes, percentage }`
10. Add orphaned file cleanup cron job in `MaintenanceService`
11. Add disk space check before upload
12. Make media deletion transactional: delete DB record first, then file (or use a cleanup queue)

---

## 9. Future Tasks

- [ ] Implement S3/MinIO storage adapter
- [ ] Switch to diskStorage or presigned URL uploads
- [ ] Add signed URL access control
- [ ] Add image thumbnail generation + EXIF stripping
- [ ] Add video transcoding (HLS)
- [ ] Add virus scanning
- [ ] Add file content type detection
- [ ] Add file hash for integrity
- [ ] Add storage usage endpoint
- [ ] Add orphaned file cleanup cron
- [ ] Add disk space monitoring
- [ ] Make media deletion transactional
