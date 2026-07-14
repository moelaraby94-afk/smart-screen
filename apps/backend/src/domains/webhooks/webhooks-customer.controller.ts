import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { ToggleWebhookDto } from './dto/toggle-webhook.dto';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get()
  list(@Query('workspaceId') workspaceId: string) {
    return this.webhooks.list(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooks.create(workspaceId, dto.url, dto.events);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':endpointId')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  delete(
    @Query('workspaceId') workspaceId: string,
    @Param('endpointId') endpointId: string,
  ) {
    return this.webhooks.delete(workspaceId, endpointId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':endpointId/toggle')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  toggle(
    @Query('workspaceId') workspaceId: string,
    @Param('endpointId') endpointId: string,
    @Body() body: ToggleWebhookDto,
  ) {
    return this.webhooks.toggle(workspaceId, endpointId, body.enabled);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':endpointId/test')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  test(
    @Query('workspaceId') workspaceId: string,
    @Param('endpointId') endpointId: string,
  ) {
    return this.webhooks.test(workspaceId, endpointId);
  }
}
