import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AudienceGuard } from './audience.guard';
import { RolesGuard } from './roles.guard';

@Injectable()
export class CustomerRouteGuard implements CanActivate {
  constructor(
    private readonly audienceGuard: AudienceGuard,
    private readonly rolesGuard: RolesGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return (
      this.audienceGuard.canActivate(context) &&
      (await this.rolesGuard.canActivate(context))
    );
  }
}
