import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class ListCampaignsDto extends PaginationQueryDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;
}
