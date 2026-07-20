import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PlayerBindScreenDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  screenId?: string;
}
