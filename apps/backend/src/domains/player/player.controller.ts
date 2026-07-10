import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { StartPairingSessionDto } from '../pairing/dto/start-pairing-session.dto';
import { PairingService } from '../pairing/pairing.service';
import { PlayerService } from './player.service';

/**
 * Unauthenticated player endpoints (kiosk). Authenticated by the `x-player-secret`
 * header: a screen's own secret (Screen.pairingSecretHash), issued once by the
 * pairing poll below. The shared PLAYER_HEARTBEAT_SECRET is only accepted for
 * screens created outside the pairing flow, which have no per-screen hash.
 *
 * Exempt from the global per-IP rate limit: every screen in a venue shares one
 * public IP, and the pairing poll below runs every two seconds, so an IP bucket
 * would throttle a whole store's playback. These routes are guarded by the
 * per-screen secret instead. The one route that is neither authenticated nor
 * idempotent — creating a pairing session — opts back in below.
 */
@SkipThrottle()
@Controller('player')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly pairing: PairingService,
  ) {}

  @Get('bootstrap')
  async bootstrap(
    @Query('serialNumber') serialNumber: string | undefined,
    @Headers('x-player-secret') secret: string | undefined,
  ) {
    return this.playerService.getBootstrap(serialNumber, secret);
  }

  /** JWT (Bearer): first screen in workspace — for player app synced with dashboard login. */
  @UseGuards(JwtAuthGuard)
  @Get('workspace-bootstrap')
  async workspaceBootstrap(
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId: string | undefined,
    @Query('workspaceName') workspaceName: string | undefined,
  ) {
    return this.playerService.getBootstrapForAuthenticatedUser(
      user,
      workspaceId,
      workspaceName,
    );
  }

  @Get('canvas/:canvasId')
  async compiledCanvas(
    @Param('canvasId') canvasId: string,
    @Query('serialNumber') serialNumber: string | undefined,
    @Headers('x-player-secret') secret: string | undefined,
  ) {
    return this.playerService.getCompiledCanvas(serialNumber, secret, canvasId);
  }

  /**
   * Pairing v2: player shows `pairingCode`, dashboard claims with workspace JWT.
   *
   * Unauthenticated and it inserts a row, so it opts back in to rate limiting
   * (the controller-level `@SkipThrottle()` above would otherwise cover it).
   * The budget is per IP and generous enough for a venue bringing several
   * screens online at once.
   */
  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('pairing/sessions')
  @HttpCode(201)
  startPairingSession(
    @Body() dto: StartPairingSessionDto,
    @Headers('x-player-secret') secret: string | undefined,
  ) {
    return this.pairing.startSession(dto, secret);
  }

  @Get('pairing/sessions/:sessionId')
  pollPairingSession(
    @Param('sessionId') sessionId: string,
    @Headers('x-pairing-poll-secret') pollSecret: string | undefined,
  ) {
    return this.pairing.pollSession(sessionId, pollSecret);
  }
}
