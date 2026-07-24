import { RenderMode, ScreenOrientation } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  groupId?: string | null;

  @IsEnum(ScreenOrientation)
  @IsOptional()
  orientation?: ScreenOrientation;

  @IsEnum(RenderMode)
  @IsOptional()
  renderMode?: RenderMode;

  @IsInt()
  @Min(320)
  @Max(7680)
  @IsOptional()
  targetWidth?: number;

  @IsInt()
  @Min(240)
  @Max(4320)
  @IsOptional()
  targetHeight?: number;
}
