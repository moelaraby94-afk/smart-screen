import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get()
  list(@Query('workspaceId') workspaceId: string) {
    return this.apiKeys.list(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeys.create(workspaceId, dto.name, dto.scopes ?? '');
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':keyId')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  revoke(
    @Query('workspaceId') workspaceId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.apiKeys.revoke(workspaceId, keyId);
  }
}
