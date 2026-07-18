import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { copyFile, rename, unlink, writeFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { IStorageService } from './storage.interface';

/**
 * Local filesystem storage — preserves the exact behaviour that
 * MediaService had before the abstraction: files under uploadRoot,
 * served via Express static middleware at /media-files/.
 *
 * This is the default provider (MEDIA_STORAGE_PROVIDER=local) and the
 * safest option for development.
 */
@Injectable()
export class LocalStorageService implements IStorageService {
  readonly providerName = 'local';
  private readonly uploadRoot: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.uploadRoot = this.config.get<string>(
      'MEDIA_UPLOAD_DIR',
      join(process.cwd(), 'uploads', 'media'),
    );
    this.publicBaseUrl = (
      this.config.get<string>('MEDIA_PUBLIC_BASE_URL') ??
      `http://localhost:${this.config.get<string>('PORT', '3000')}`
    ).replace(/\/$/, '');
  }

  async upload(key: string, buffer: Buffer): Promise<void> {
    const abs = this.resolve(key);
    mkdirSync(dirname(abs), { recursive: true });
    await writeFile(abs, buffer);
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolve(key)).catch(() => {
      /* already gone */
    });
  }

  async copy(srcKey: string, destKey: string): Promise<void> {
    const src = this.resolve(srcKey);
    const dest = this.resolve(destKey);
    mkdirSync(dirname(dest), { recursive: true });
    await copyFile(src, dest);
  }

  async move(srcKey: string, destKey: string): Promise<void> {
    const src = this.resolve(srcKey);
    const dest = this.resolve(destKey);
    mkdirSync(dirname(dest), { recursive: true });
    await rename(src, dest);
  }

  exists(key: string): Promise<boolean> {
    return Promise.resolve(existsSync(this.resolve(key)));
  }

  ensureDir(keyPrefix: string): void {
    const dir = this.resolve(keyPrefix);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  getPublicUrl(key: string): string {
    /**
     * main.ts serves static files from `uploads/` (whole directory) under
     * `/media-files/`. Files live under `uploadRoot` (default `uploads/media/`).
     * Derive the prefix gap so the URL matches the static route exactly.
     */
    const staticRoot = join(process.cwd(), 'uploads');
    const uploadRootPrefix = relative(staticRoot, this.uploadRoot).replace(
      /\\/g,
      '/',
    );
    const fullRelativePath = uploadRootPrefix
      ? `${uploadRootPrefix}/${key}`
      : key;
    const segments = fullRelativePath
      .split('/')
      .map(encodeURIComponent)
      .join('/');
    return `${this.publicBaseUrl}/media-files/${segments}`;
  }

  getSignedUrl(key: string): Promise<string> {
    return Promise.resolve(this.getPublicUrl(key));
  }

  /** Resolves a relative key to an absolute filesystem path. */
  resolve(key: string): string {
    return join(this.uploadRoot, ...key.split('/'));
  }

  /** Returns the upload root directory (used by MediaService for compat). */
  getUploadRoot(): string {
    return this.uploadRoot;
  }
}
