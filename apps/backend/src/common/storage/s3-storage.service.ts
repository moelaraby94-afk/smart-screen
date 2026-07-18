import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getPresignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from './storage.interface';

/**
 * S3-compatible storage service.
 *
 * Works with:
 * - AWS S3 (https://s3.{region}.amazonaws.com)
 * - MinIO (http://localhost:9000)
 * - Cloudflare R2 (https://{accountId}.r2.cloudflarestorage.com)
 *
 * Configuration via env vars:
 * - S3_BUCKET — bucket name
 * - S3_REGION — region (use "auto" for Cloudflare R2)
 * - S3_ENDPOINT — custom endpoint (MinIO or R2)
 * - S3_ACCESS_KEY — access key ID
 * - S3_SECRET_KEY — secret access key
 * - MEDIA_PUBLIC_BASE_URL — base URL for public access (CDN or bucket URL)
 *
 * Official sources:
 * - AWS SDK v3: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
 * - Cloudflare R2: https://developers.cloudflare.com/r2/get-started/s3/
 * - MinIO: https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html
 */
@Injectable()
export class S3StorageService implements IStorageService {
  readonly providerName = 's3';
  private readonly log = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET') ?? '';
    this.publicBaseUrl = (
      this.config.get<string>('MEDIA_PUBLIC_BASE_URL') ?? ''
    ).replace(/\/$/, '');

    if (!this.bucket) {
      throw new Error(
        'S3_BUCKET is required when MEDIA_STORAGE_PROVIDER=s3 — ' +
          'set it in your environment or switch to MEDIA_STORAGE_PROVIDER=local.',
      );
    }

    this.client = new S3Client({
      region: this.config.get<string>('S3_REGION', 'auto'),
      endpoint: this.config.get<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY') ?? '',
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY') ?? '',
      },
      forcePathStyle: Boolean(this.config.get<string>('S3_ENDPOINT')),
    });
    this.log.log(
      `S3: configured bucket="${this.bucket}" provider="${this.config.get<string>('S3_ENDPOINT') ?? 'AWS'}"`,
    );
  }

  async upload(key: string, buffer: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch(() => {
        /* already gone */
      });
  }

  async copy(srcKey: string, destKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        Key: destKey,
        CopySource: `${this.bucket}/${srcKey}`,
      }),
    );
  }

  async move(srcKey: string, destKey: string): Promise<void> {
    await this.copy(srcKey, destKey);
    await this.delete(srcKey);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  ensureDir(_keyPrefix: string): void {
    // No-op — S3 has no directories.
  }

  getPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`;
    }
    /**
     * Fallback: construct URL from endpoint + bucket.
     * For path-style endpoints (MinIO): {endpoint}/{bucket}/{key}
     * For virtual-hosted-style (AWS S3): https://{bucket}.s3.{region}.amazonaws.com/{key}
     */
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    if (endpoint) {
      return `${endpoint.replace(/\/$/, '')}/${this.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
    }
    const region = this.config.get<string>('S3_REGION', 'us-east-1');
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getPresignedUrl(this.client, command, { expiresIn });
  }
}
