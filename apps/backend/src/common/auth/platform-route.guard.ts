import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AudienceGuard } from './audience.guard';
import { PlatformStaffDbGuard } from './platform-staff-db.guard';

@Injectable()
export class PlatformRouteGuard implements CanActivate {
  constructor(
    private readonly audienceGuard: AudienceGuard,
    private readonly platformStaffGuard: PlatformStaffDbGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return (
      this.audienceGuard.canActivate(context) &&
      (await this.platformStaffGuard.canActivate(context))
    );
  }
}
