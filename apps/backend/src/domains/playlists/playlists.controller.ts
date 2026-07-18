import {
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
import {
  CurrentUser,
  type JwtUser,
} from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { ClonePlaylistDto } from './dto/clone-playlist.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { ReplacePlaylistItemsDto } from './dto/replace-playlist-items.dto';
import { ListPlaylistsDto } from './dto/list-playlists.dto';
import { PlaylistsService } from './playlists.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  // ─── Playlist Groups (account-level, no workspaceId needed) ───────
  // Must be before :id routes to avoid route conflicts.

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('groups')
  listGroups(@CurrentUser() user: JwtUser) {
    return this.playlistsService.listGroups(user.sub);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post('groups')
  createGroup(
    @Body() body: { name: string; parentGroupId?: string | null },
    @CurrentUser() user: JwtUser,
  ) {
    return this.playlistsService.createGroup(
      user.sub,
      body.name,
      body.parentGroupId ?? null,
    );
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Patch('groups/:groupId')
  renameGroup(
    @Param('groupId') groupId: string,
    @Body() body: { name: string },
    @CurrentUser() user: JwtUser,
  ) {
    return this.playlistsService.renameGroup(user.sub, groupId, body.name);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(204)
  @Delete('groups/:groupId')
  async deleteGroup(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    await this.playlistsService.deleteGroup(user.sub, groupId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Patch('groups/:groupId/move')
  moveGroup(
    @Param('groupId') groupId: string,
    @Body() body: { newParentId: string | null },
    @CurrentUser() user: JwtUser,
  ) {
    return this.playlistsService.moveGroup(
      user.sub,
      groupId,
      body.newParentId ?? null,
    );
  }

  // ─── Playlist CRUD ─────────────────────────────────────────────────

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get()
  list(@Query() query: ListPlaylistsDto, @CurrentUser() user: JwtUser) {
    return this.playlistsService.list(user.sub, query.workspaceId, query);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':id')
  getOne(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.playlistsService.getOne(workspaceId, id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(@Body() dto: CreatePlaylistDto, @CurrentUser() user: JwtUser) {
    return this.playlistsService.create(
      user.sub,
      dto.workspaceId ?? null,
      dto.name,
      dto.groupId ?? null,
    );
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(workspaceId, id, dto);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/duplicate')
  duplicate(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.playlistsService.duplicateInWorkspace(workspaceId, id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/clone-to-workspace')
  cloneToWorkspace(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: ClonePlaylistDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.playlistsService.cloneToWorkspace(
      user.sub,
      workspaceId,
      id,
      dto.targetWorkspaceId,
    );
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id/items')
  replaceItems(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: ReplacePlaylistItemsDto,
  ) {
    return this.playlistsService.replaceItems(workspaceId, id, dto);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(204)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Query('force') force?: string,
  ): Promise<void> {
    await this.playlistsService.remove(workspaceId, id, {
      force: force === 'true' || force === '1',
    });
  }
}
