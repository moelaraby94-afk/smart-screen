import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

/**
 * Whole-query DTO. `@Query()` is validated with `forbidNonWhitelisted`, so every
 * accepted parameter must be declared here.
 *
 * Replaces the previous `take`/`skip` pair: `?take=` parsed to `Number('') === 0`
 * and silently returned an empty list, and the pair disagreed with the
 * `page`/`limit` convention every other list endpoint uses.
 */
export class ListMediaDto extends PaginationQueryDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsString()
  @IsOptional()
  folderId?: string;
}
