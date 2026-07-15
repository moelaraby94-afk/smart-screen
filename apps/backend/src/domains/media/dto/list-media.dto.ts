import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

/**
 * Whole-query DTO. `@Query()` is validated with `forbidNonWhitelisted`, so every
 * accepted parameter must be declared here.
 */
export class ListMediaDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  folderId?: string;
}
