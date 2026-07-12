import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginTwoFactorDto {
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsEmail({ require_tld: false })
  email!: string;

  @IsString()
  @MinLength(3)
  password!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(8)
  twoFactorToken!: string;
}
