import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScreenRegisterDto {
  @IsString()
  @IsNotEmpty()
  serialNumber!: string;

  @IsString()
  @IsNotEmpty()
  secret!: string;

  @IsOptional()
  @IsString()
  playerVersion?: string;
}
