import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/auth/current-user.decorator';
import { FolderNameDto } from './dto/folder-name.dto';
import { ListMediaDto } from './dto/list-media.dto';
import { MediaStatsQueryDto } from './dto/media-stats-query.dto';
import { MoveMediaFolderDto } from './dto/move-media-folder.dto';
import { MediaService } from './media.service';

const MAX_BYTES = 150 * 1024 * 1024;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId?: string,
    @Query('folderId') folderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    const created = await this.mediaService.saveUploadedFile({
      ownerId: user.sub,
      workspaceId: workspaceId ?? null,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      folderId: folderId ?? null,
    });
    return this.mediaService.toResponse(created);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get()
  list(@Query() query: ListMediaDto, @CurrentUser() user: JwtUser) {
    return this.mediaService.list(user.sub, query);
  }

  /** Counted in the database so clients never download the library to total it. */
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('stats')
  stats(@Query() query: MediaStatsQueryDto, @CurrentUser() user: JwtUser) {
    return this.mediaService.stats(user.sub, query.workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ): Promise<void> {
    await this.mediaService.remove(workspaceId, id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('folders/list')
  listFolders(
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.mediaService.listFolders(user.sub, workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post('folders')
  createFolder(
    @Body() dto: FolderNameDto,
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.mediaService.createFolder(
      user.sub,
      workspaceId ?? null,
      dto.name,
    );
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Patch('folders/:id')
  renameFolder(
    @Param('id') id: string,
    @Body() dto: FolderNameDto,
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.mediaService.renameFolder(
      user.sub,
      workspaceId ?? null,
      id,
      dto.name,
    );
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Delete('folders/:id')
  deleteFolder(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.mediaService.deleteFolder(user.sub, workspaceId ?? null, id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':id/url')
  async getMediaUrl(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!workspaceId) throw new BadRequestException('workspaceId is required');
    return this.mediaService.getMediaUrl(workspaceId, id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id/folder')
  moveMediaFolder(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: MoveMediaFolderDto,
  ) {
    if (!workspaceId) throw new BadRequestException('workspaceId is required');
    return this.mediaService.moveMediaToFolder(
      workspaceId,
      id,
      dto.folderId ?? null,
    );
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id/expiry')
  async setExpiry(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() body: { expiresAt: string | null },
  ) {
    if (!workspaceId) throw new BadRequestException('workspaceId is required');
    const updated = await this.mediaService.setExpiry(
      workspaceId,
      id,
      body.expiresAt,
    );
    return this.mediaService.toResponse(updated);
  }
}
