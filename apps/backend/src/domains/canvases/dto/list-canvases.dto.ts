import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class ListCanvasesDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  workspaceId?: string;
}
