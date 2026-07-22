import { RenderMode, ScreenOrientation } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdatePlaylistDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined)
  @IsBoolean()
  isPublished?: boolean;

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
