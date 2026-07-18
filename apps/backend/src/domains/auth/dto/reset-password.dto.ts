import { IsEmail, IsString, MinLength } from 'class-validator';
import { MatchesPasswordComplexity } from '../../../common/validators/password-complexity.decorator';

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  token!: string;

  @IsString()
  @MinLength(8)
  @MatchesPasswordComplexity()
  newPassword!: string;
}
