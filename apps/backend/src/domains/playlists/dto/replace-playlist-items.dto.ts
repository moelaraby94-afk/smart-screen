import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PlaylistItemInputDto {
  @IsOptional()
  @IsString()
  mediaId?: string;

  @IsOptional()
  @IsString()
  canvasId?: string;

  @IsOptional()
  @IsString()
  playlistId?: string;

  @IsInt()
  @Min(1)
  durationSec!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  orderIndex?: number;

  @IsOptional()
  @IsString()
  zoneName?: string;
}

export class ReplacePlaylistItemsDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => PlaylistItemInputDto)
  items!: PlaylistItemInputDto[];
}
