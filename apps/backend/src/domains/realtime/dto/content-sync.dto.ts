import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ContentSyncDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  screenId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  workspaceId?: string;
}
