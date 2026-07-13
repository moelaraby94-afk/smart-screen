import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateRamadanConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  iftarPlaylistId?: string | null;

  @IsOptional()
  @IsString()
  suhoorPlaylistId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  iftarBuffer?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  suhoorBuffer?: number;

  @IsOptional()
  @IsBoolean()
  showHijriDate?: boolean;

  @IsOptional()
  @IsBoolean()
  showPrayerTimes?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}
