import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { MatchesPasswordComplexity } from '../../../common/validators/password-complexity.decorator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @MinLength(8)
  @MatchesPasswordComplexity()
  password!: string;

  @IsString()
  @IsIn(['en', 'ar'])
  locale: 'en' | 'ar' = 'en';
}
