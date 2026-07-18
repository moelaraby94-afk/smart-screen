import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class ScreenHeartbeatDto {
  @IsOptional()
  @IsBoolean()
  isOfflineMode?: boolean;

  @IsOptional()
  @IsString()
  playerVersion?: string;

  @IsOptional()
  @IsString()
  playerPlatform?: string;

  @IsOptional()
  @IsNumber()
  uptimeSeconds?: number;

  @IsOptional()
  @IsNumber()
  batteryLevel?: number;

  @IsOptional()
  @IsBoolean()
  batteryCharging?: boolean;

  @IsOptional()
  @IsNumber()
  resolutionWidth?: number;

  @IsOptional()
  @IsNumber()
  resolutionHeight?: number;

  @IsOptional()
  @IsString()
  networkType?: string;
}
