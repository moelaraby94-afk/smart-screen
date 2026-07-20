import { Module } from '@nestjs/common';
import { StorageModule } from '../../common/storage/storage.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaFoldersService } from './media-folders.service';

@Module({
  imports: [StorageModule],
  controllers: [MediaController],
  providers: [MediaService, MediaFoldersService],
  exports: [MediaService, MediaFoldersService],
})
export class MediaModule {}
