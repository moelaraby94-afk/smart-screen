import { IsObject, IsOptional, IsString } from 'class-validator';

export class ScreenClientErrorDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}
