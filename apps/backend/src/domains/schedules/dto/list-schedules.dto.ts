import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

/**
 * Whole-query DTO. `@Query()` is validated with `forbidNonWhitelisted`, so every
 * accepted parameter must be declared here — binding `PaginationQueryDto`
 * directly would reject `workspaceId` as an unknown property.
 */
export class ListSchedulesDto extends PaginationQueryDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;
}
