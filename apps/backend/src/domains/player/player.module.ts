import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CanvasesModule } from '../canvases/canvases.module';
import { IslamicModule } from '../islamic/islamic.module';
import { PairingModule } from '../pairing/pairing.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

@Module({
  imports: [
    AuthModule,
    PlaylistsModule,
    CanvasesModule,
    PairingModule,
    IslamicModule,
  ],
  controllers: [PlayerController],
  providers: [PlayerService],
})
export class PlayerModule {}
