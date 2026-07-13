import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const VALID_PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export class UpdatePrayerConfigDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  method?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  asrJuristic?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  bufferBefore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  bufferAfter?: number;

  @IsOptional()
  @IsArray()
  @IsIn(VALID_PRAYERS, { each: true })
  enabledPrayers?: string[];

  @IsOptional()
  @IsBoolean()
  autoPauseEnabled?: boolean;
}
