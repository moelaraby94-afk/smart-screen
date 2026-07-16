# Media Flows

> **Evidence basis:** `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-02, `product-architecture/09-product-modules.md` M-03, `product-architecture/17-product-rules.md` PR-34, `03-decision-trees.md` §6
> **Purpose:** Complete user flow documentation for Media Upload, Media Delete, and Media Replace

---

## FL-MED-01: Media Upload

| Field | Value |
|-------|-------|
| Flow ID | FL-MED-01 |
| Flow Name | Media Upload |
| Purpose | Upload media files (images, videos) to workspace library |
| Primary User | Editor, Workspace Owner |
| Business Goal | Content creation enablement; storage utilization |
| User Goal | Add media files for use in playlists |
| Starting Point | `/content/media` (click "Upload" or drag files) |
| Ending Point | `/content/media` (files in library) |
| Success Criteria | All files uploaded successfully; appear in media grid |
| Failure Criteria | File type invalid; file too large; storage limit; network loss |
| Frequency | Weekly |
| Business Importance | High |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate upload**
- Screen: `/content/media`
- User Action: Clicks "Upload" button OR drags files onto page
- System Response: If button: opens file picker. If drag: shows drop zone overlay.
- Permission Check: 🔒 Owner or Editor (button hidden for Viewer)
- Micro Interaction: Drop zone overlay appears with "Drop files here" (MI-08, 200ms fade)
- Accessibility: "Upload" button triggers hidden file input; keyboard accessible
- Mobile: Drag-drop not available; "Upload" button only

**Step 2: Select files**
- User Action: Selects one or more files from file picker (or drops files)
- System Response: Files queued for upload; per-file validation begins
- Validation: File type (image: jpg, png, gif, webp; video: mp4, webm), file size (per plan limit)
- Data Required: File binary, filename, file type, file size
- State Transition: IDLE → QUEUED (per file, see `04-state-machines.md` §8)

**Step 3: Upload files**
- System Response: Parallel uploads (max 3 concurrent); per-file progress bar
- Loading: Progress bar per file (0-100%)
- State Transition: QUEUED → UPLOADING (per file)
- Micro Interaction: Progress bar animates smoothly (MI-04)
- Performance: Max 3 concurrent uploads to avoid bandwidth saturation

**Step 4: Upload complete**
- System Response: API returns success for each file
- State Transition: UPLOADING → COMPLETE (per file)
- Success: File appears in media grid with thumbnail
- Feedback: Toast: "[N] files uploaded successfully"
- Micro Interaction: New cards fade in (MI-08) in media grid

### Alternative Paths

**AP-1: Drag and drop**
- User drags files from file explorer onto the page
- Drop zone overlay appears (full page)
- User drops files → upload begins (same as Step 3)

**AP-2: Upload from Studio (future)**
- User in Studio clicks "Upload" in media panel (Upload tab)
- Same upload flow, but files appear in Studio media panel instead of media grid

### Failure Paths

**FP-1: Invalid file type**
- Trigger: File extension not in allowed list
- UI: Per-file error: "Only images (JPG, PNG, GIF, WebP) and videos (MP4, WebM) are allowed"
- Recovery: User selects different file

**FP-2: File too large**
- Trigger: File size exceeds plan limit
- UI: Per-file error: "File exceeds [N]MB limit"
- Recovery: User compresses file or selects smaller file

**FP-3: Storage limit reached**
- Trigger: Workspace storage at 100%
- UI: Error: "Storage limit reached. Upgrade your plan or delete old media." + "Upgrade" link
- Recovery: User upgrades plan (FL-ST-04) or deletes media (FL-MED-02)

**FP-4: Upload failure (network)**
- Trigger: Network loss during upload
- UI: Per-file error indicator + "Retry Upload" button
- Recovery: User clicks "Retry" for failed file(s)
- State Transition: UPLOADING → ERROR → (retry) → UPLOADING

**FP-5: Partial failure**
- Trigger: Some files succeed, some fail
- UI: Successful files appear in grid; failed files show error + "Retry"
- Feedback: Toast: "[N] files uploaded, [M] failed"
- Recovery: User retries failed files only

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| Invalid type | Select different file | Step 2 |
| Too large | Compress or select smaller | Step 2 |
| Storage limit | Upgrade or delete media | Step 1 |
| Network loss | Click "Retry" per file | Step 3 |
| Partial failure | Retry failed files | Step 3 |

### First-Time User Path
- Same as Happy Path
- May be guided by onboarding (FL-OB-03)

### Returning User Path
- Same as Happy Path
- Knows drag-drop is available

### Power User Path
- Drag files directly onto page (no button click)
- Multi-file select from file picker (Ctrl+click)

### Offline Path
- Network loss during upload: Per-file error + "Retry"
- Auto-retry when connection restored (if within 30s)
- If auto-retry fails: Manual "Retry" button

### Timeout Path
- Upload > 60s per file: Toast: "Upload is taking longer than expected..."
- Upload timeout (5min): Per-file error: "Upload timed out. Try again."

### Cancellation Path
- (Future) User can cancel individual file upload (cancel button on progress bar)
- Cancelled files: State → CANCELLED, removed from upload list

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| File size limits | Low — shown in upload dialog | Display allowed file types and size limits before upload |
| Drag-drop zone | Low — full page drop zone | Full page overlay makes drop target obvious |
| Upload progress | Low — per-file progress bars | Progress bars show percentage and estimated time |

---

## FL-MED-02: Media Delete

| Field | Value |
|-------|-------|
| Flow ID | FL-MED-02 |
| Flow Name | Media Delete |
| Purpose | Remove media file from library |
| Primary User | Editor, Workspace Owner |
| Business Goal | Storage management; cleanup |
| User Goal | Remove unused or unwanted media |
| Starting Point | `/content/media` (card "More" menu) |
| Ending Point | `/content/media` (file removed) |
| Success Criteria | File deleted from library |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate delete**
- Screen: `/content/media`
- User Action: Clicks "More" (⋯) on media card → "Delete"
- System Response: Opens AlertDialog
- Permission Check: 🔒 Owner or Editor

**Step 2: Confirm deletion**
- Screen: AlertDialog
- UI: "Delete [filename]?" with warning if used in playlists: "This file is used in [N] playlist(s). Those playlists will show a blank space where this media was."
- User Action: Clicks "Delete" (destructive button)
- Focus: Default on "Cancel" (safe default)
- Loading: Spinner on delete button

**Step 3: Deletion success**
- System Response: API returns 200
- State Transition: UPLOADED → DELETED
- UI: Card removed from grid (fade-out animation, MI-09)
- Feedback: Toast: "File deleted"

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to delete file. Try again."
- Recovery: User retries

### Cancellation Path
- User clicks "Cancel" in AlertDialog → dialog closes, no action
- Keyboard: Escape closes dialog

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Delete used media | Medium — breaks playlist | AlertDialog warns about playlist usage count |
| Accidental delete | Low — confirmation required | Destructive button styling; default focus on "Cancel" |

---

## FL-MED-03: Media Replace

| Field | Value |
|-------|-------|
| Flow ID | FL-MED-03 |
| Flow Name | Media Replace |
| Purpose | Replace a media file with a new version while preserving playlist references |
| Primary User | Editor, Workspace Owner |
| Business Goal | Content update without breaking playlists |
| User Goal | Update media file without re-creating playlists |
| Starting Point | `/content/media` (card "More" menu — future) |
| Ending Point | `/content/media` (file replaced) |
| Success Criteria | New file replaces old; all playlist references preserved |
| Failure Criteria | API failure; new file invalid |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate replace**
- Screen: `/content/media`
- User Action: Clicks "More" (⋯) on media card → "Replace" (future)
- System Response: Opens file picker
- Permission Check: 🔒 Owner or Editor

**Step 2: Select replacement file**
- User Action: Selects new file from file picker
- System Response: Validates file (type, size)
- Validation: Same as upload (FL-MED-01 Step 2)

**Step 3: Upload and replace**
- System Response: API call to replace media file (preserves ID and all references)
- Loading: Progress bar
- State Transition: UPLOADED → UPLOADING → UPLOADED (same ID, new content)
- Success: Thumbnail updates in grid + toast: "Media replaced"
- Feedback: Toast: "[filename] replaced. All playlists using this media are updated."

### Failure Paths

**FP-1: Invalid file**
- Same as FL-MED-01 FP-1 and FP-2

**FP-2: API failure**
- UI: Toast: "Failed to replace media. Try again."
- Recovery: User retries

### Cancellation Path
- User cancels file picker → no action taken

### UX Notes
- Media replace preserves the media ID so all playlist references remain valid
- This is a future feature — currently users must delete and re-add media, then update playlists
- Replace is especially valuable for seasonal content (swap holiday image without re-creating playlists)

---

## Cross-References

- See `03-decision-trees.md` §6 for media upload decision tree
- See `04-state-machines.md` §3 and §8 for media and upload state machines
- See `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-02 for media tab UX blueprint
- See `product-architecture/09-product-modules.md` M-03 for content module
- See `10-playlist-flows.md` for playlist creation and editing flows
