import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Liveness probe — always returns 200 if the process is running.
   * Registered before the global prefix so it's reachable at `/health`.
   */
  @Get('health')
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /**
   * Readiness probe — returns 200 only if the database is reachable.
   * Returns 503 if the DB ping fails.
   */
  @Get('ready')
  async readiness(): Promise<{ status: 'ready' }> {
    return this.healthService.checkReadiness();
  }
}
