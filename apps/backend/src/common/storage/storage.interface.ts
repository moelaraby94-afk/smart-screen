/**
 * Storage abstraction interface.
 *
 * Allows switching between local filesystem and S3-compatible storage
 * (AWS S3, MinIO, Cloudflare R2) via the MEDIA_STORAGE_PROVIDER env var.
 *
 * All keys are relative paths (e.g. "workspace-id/uuid.png") — the
 * implementation handles the physical location.
 */
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface IStorageService {
  /**
   * Uploads a buffer to the given key.
   * For local storage, creates parent directories as needed.
   * For S3, uses PutObjectCommand.
   */
  upload(key: string, buffer: Buffer): Promise<void>;

  /**
   * Deletes the object at the given key.
   * Silently succeeds if the object does not exist.
   */
  delete(key: string): Promise<void>;

  /**
   * Copies an object from srcKey to destKey.
   * For local storage, creates parent directories for destKey.
   * For S3, uses CopyObjectCommand (server-side copy).
   */
  copy(srcKey: string, destKey: string): Promise<void>;

  /**
   * Checks whether an object exists at the given key.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Moves an object from srcKey to destKey.
   * For local storage, uses atomic rename (same filesystem).
   * For S3, uses CopyObject + DeleteObject.
   */
  move(srcKey: string, destKey: string): Promise<void>;

  /**
   * Ensures the directory for the given key prefix exists.
   * For local storage, creates directories recursively.
   * For S3, this is a no-op (S3 has no directories).
   */
  ensureDir(keyPrefix: string): void;

  /**
   * Returns a publicly accessible URL for the given key.
   * For local storage, returns a URL under /media-files/.
   * For S3, returns the bucket's public URL (or signed URL in Phase 6).
   */
  getPublicUrl(key: string): string;

  /**
   * Returns a signed URL for temporary access to the object.
   * For local storage, returns the same as getPublicUrl() (no signing needed).
   * For S3, generates a presigned URL valid for `expiresIn` seconds.
   *
   * Official source: AWS SDK v3 presigned URLs —
   * https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  /** Returns the storage provider name (e.g. "local", "s3"). */
  readonly providerName: string;
}
