import { IsNotEmpty, IsString } from 'class-validator';

export class MediaStatsQueryDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;
}
