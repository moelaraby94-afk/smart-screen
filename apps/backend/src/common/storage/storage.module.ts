import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_SERVICE, IStorageService } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';

/**
 * Storage module — selects the storage provider based on MEDIA_STORAGE_PROVIDER.
 *
 * Values:
 * - "local" (default) — LocalStorageService (filesystem, backward compatible)
 * - "s3" — S3StorageService (AWS S3, MinIO, Cloudflare R2)
 *
 * Only the selected provider is instantiated — the other is never created,
 * avoiding unnecessary connections (e.g. S3Client when using local storage).
 *
 * The selected provider is registered under the STORAGE_SERVICE token
 * so any module can inject `@Inject(STORAGE_SERVICE) storage: IStorageService`.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_SERVICE,
      useFactory: (config: ConfigService): IStorageService => {
        const provider = config.get<string>('MEDIA_STORAGE_PROVIDER', 'local');
        if (provider === 's3') {
          return new S3StorageService(config);
        }
        return new LocalStorageService(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
