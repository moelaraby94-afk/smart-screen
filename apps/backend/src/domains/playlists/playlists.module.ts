import { Module } from '@nestjs/common';
import { CanvasesModule } from '../canvases/canvases.module';
import { MediaModule } from '../media/media.module';
import { SchedulingModule } from '../schedules/scheduling.module';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { PlaylistGroupsService } from './playlist-groups.service';
import { PlaylistResolutionService } from './playlist-resolution.service';

@Module({
  imports: [SchedulingModule, MediaModule, CanvasesModule],
  controllers: [PlaylistsController],
  providers: [
    PlaylistsService,
    PlaylistGroupsService,
    PlaylistResolutionService,
  ],
  exports: [PlaylistsService, PlaylistGroupsService, PlaylistResolutionService],
})
export class PlaylistsModule {}
