import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CanvasesModule } from '../canvases/canvases.module';
import { IslamicModule } from '../islamic/islamic.module';
import { PairingModule } from '../pairing/pairing.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { PlayerSecretGuard } from './player-secret.guard';
import { PlayerTelemetryController } from './player-telemetry.controller';

@Module({
  imports: [
    AuthModule,
    PlaylistsModule,
    CanvasesModule,
    PairingModule,
    IslamicModule,
    PrismaModule,
  ],
  controllers: [PlayerController, PlayerTelemetryController],
  providers: [PlayerService, PlayerSecretGuard],
})
export class PlayerModule {}
