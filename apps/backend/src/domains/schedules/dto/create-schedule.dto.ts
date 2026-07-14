import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const HHmm = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsString()
  @IsNotEmpty()
  playlistId!: string;

  @IsOptional()
  @IsString()
  screenId?: string | null;

  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @Type(() => Number)
  daysOfWeek!: number[];

  @IsOptional()
  @IsIn(['WEEKLY', 'MONTHLY'])
  recurrence?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(31)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  @Type(() => Number)
  daysOfMonth?: number[];

  @IsString()
  @Matches(HHmm, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @IsString()
  @Matches(HHmm, { message: 'endTime must be HH:mm' })
  endTime!: string;

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
