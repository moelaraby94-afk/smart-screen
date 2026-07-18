import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ScreenHeartbeatDto {
  @IsOptional()
  @IsBoolean()
  isOfflineMode?: boolean;

  @IsOptional()
  @IsString()
  playerVersion?: string;
}
