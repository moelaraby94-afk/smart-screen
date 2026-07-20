import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthService: HealthService,
  ) {}

  /**
   * Liveness probe — always returns 200 if the process is running.
   * Registered before the global prefix so it's reachable at `/health`.
   * Also reachable at `/api/v1/public/health` via the global prefix.
   */
  @Get(['health', 'public/health'])
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /**
   * Readiness probe — returns 200 only if all dependencies are reachable:
   * - Database (Prisma)
   * - Redis (if configured)
   * - Storage (local or S3)
   *
   * Returns 503 if any dependency fails.
   * Also reachable at `/api/v1/public/ready` via the global prefix.
   */
  @Get(['ready', 'public/ready'])
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.healthService.checkDatabase(),
      () => this.healthService.checkRedis(),
      () => this.healthService.checkStorage(),
    ]);
  }
}
