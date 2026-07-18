import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { RecurrenceType } from '@prisma/client';

const HHmm = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  playlistId?: string;

  @IsOptional()
  @IsString()
  screenId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @Type(() => Number)
  daysOfWeek?: number[];

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrence?: RecurrenceType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(31)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  @Type(() => Number)
  daysOfMonth?: number[];

  @IsOptional()
  @IsString()
  @Matches(HHmm, { message: 'startTime must be HH:mm' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(HHmm, { message: 'endTime must be HH:mm' })
  endTime?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  @Type(() => Number)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
