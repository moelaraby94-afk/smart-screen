import { IsOptional, IsString } from 'class-validator';

export class MediaStatsQueryDto {
  @IsString()
  @IsOptional()
  workspaceId?: string;
}
