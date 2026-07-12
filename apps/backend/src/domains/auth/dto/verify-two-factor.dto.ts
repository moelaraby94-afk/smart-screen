import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  token!: string;

  @IsString()
  @IsOptional()
  secret?: string;
}
