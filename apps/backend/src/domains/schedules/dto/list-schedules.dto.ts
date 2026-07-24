import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class ListSchedulesDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  workspaceId?: string;
}
