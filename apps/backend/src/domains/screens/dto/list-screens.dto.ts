import { ScreenStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

/**
 * `page`/`limit` come from PaginationQueryDto, which clamps `limit` to
 * MAX_PAGE_SIZE. Previously `limit` was `@Min(1)` with no ceiling, so
 * `?limit=1000000` was accepted and the pagination did nothing.
 */
export class ListScreensDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsEnum(ScreenStatus)
  @IsOptional()
  status?: ScreenStatus;

  @IsString()
  @IsOptional()
  playlistGroupId?: string;

  @Transform(
    ({ value }: { value: unknown }) => value === 'true' || value === true,
  )
  @IsBoolean()
  @IsOptional()
  ungrouped?: boolean;
}
