import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/auth/current-user.decorator';
import { CreateCanvasDto } from './dto/create-canvas.dto';
import { UpdateCanvasDto } from './dto/update-canvas.dto';
import { ListCanvasesDto } from './dto/list-canvases.dto';
import { CanvasesService } from './canvases.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('canvases')
export class CanvasesController {
  constructor(private readonly canvasesService: CanvasesService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get()
  list(@Query() query: ListCanvasesDto) {
    return this.canvasesService.list(query.workspaceId, query);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':id')
  getOne(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    if (!workspaceId) throw new BadRequestException('workspaceId is required');
    return this.canvasesService.getById(workspaceId, id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateCanvasDto,
  ) {
    if (!workspaceId) throw new BadRequestException('workspaceId is required');
    return this.canvasesService.create(workspaceId, user.sub, dto);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpdateCanvasDto,
  ) {
    if (!workspaceId) throw new BadRequestException('workspaceId is required');
    return this.canvasesService.update(workspaceId, id, dto);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(204)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ): Promise<void> {
    if (!workspaceId) throw new BadRequestException('workspaceId is required');
    await this.canvasesService.remove(workspaceId, id);
  }
}
